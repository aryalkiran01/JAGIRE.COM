/* eslint-disable @typescript-eslint/no-explicit-any */

export type ResumeErrorCode =
  | "FILE_DOWNLOAD_FAILED"
  | "UNSUPPORTED_FILE_TYPE"
  | "FILE_PARSE_FAILED"
  | "INSUFFICIENT_TEXT"
  | "NOT_A_RESUME";

export class ResumeScanError extends Error {
  constructor(
    public readonly code: ResumeErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ResumeScanError";
  }
}

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const DOCX_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // PK (zip)
const DOC_OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0]; // OLE compound doc

export type DetectedFileType = "pdf" | "docx" | "doc" | "text" | "unknown";

export function detectFileType(
  buf: Uint8Array,
  fileName: string,
  mimeType?: string,
): DetectedFileType {
  const name = (fileName ?? "").toLowerCase();
  const mime = (mimeType ?? "").toLowerCase();

  if (buf.length >= 4) {
    if (PDF_MAGIC.every((b, i) => buf[i] === b)) return "pdf";
    if (DOCX_MAGIC.every((b, i) => buf[i] === b)) {
      if (name.endsWith(".docx") || mime.includes("wordprocessingml")) return "docx";
      if (name.endsWith(".doc") || mime.includes("msword")) return "doc";
      return "docx";
    }
    if (DOC_OLE_MAGIC.every((b, i) => buf[i] === b)) return "doc";
  }

  if (name.endsWith(".pdf") || mime.includes("pdf")) return "pdf";
  if (name.endsWith(".docx") || mime.includes("wordprocessingml")) return "docx";
  if (name.endsWith(".doc") || mime.includes("msword")) return "doc";
  if (name.endsWith(".txt") || name.endsWith(".md") || mime.includes("text")) return "text";

  return "unknown";
}

const MIN_TEXT_LENGTH = 50;

function cleanText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function looksLikeResumeText(text: string): boolean {
  if (text.length < MIN_TEXT_LENGTH) return false;
  const lower = text.toLowerCase();
  const resumeKeywords = [
    "experience",
    "education",
    "skills",
    "summary",
    "objective",
    "employment",
    "qualification",
    "career",
    "professional",
    "university",
    "college",
    "degree",
    "certificate",
    "internship",
    "project",
    "achievement",
    "responsibility",
    "contact",
  ];
  let hits = 0;
  for (const kw of resumeKeywords) {
    if (lower.includes(kw)) hits++;
  }
  return hits >= 2;
}

async function extractFromDocx(buf: Uint8Array): Promise<string> {
  const mammoth = await import("mammoth");
  const res = await mammoth.extractRawText({ buffer: Buffer.from(buf) });
  return res.value ?? "";
}

async function extractFromPdf(buf: Uint8Array): Promise<string> {
  let text = "";
  let success = false;

  try {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = pdfParseModule.default ?? pdfParseModule;
    const pdfData = await pdfParse(Buffer.from(buf));
    text = pdfData.text ?? "";
    success = text.trim().length >= MIN_TEXT_LENGTH;
  } catch {
    // Fallback to other PDF extraction strategies.
  }

  if (!success) {
    try {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(buf);
      const out = await extractText(pdf, { mergePages: true });
      text = Array.isArray(out.text) ? out.text.join("\n") : (out.text as string);
      success = (text ?? "").trim().length >= MIN_TEXT_LENGTH;
    } catch {
      // Fallback to OCR or heuristic extraction.
    }
  }

  if (!success) {
    text = await extractFromPdfOcr(buf);
    success = text.trim().length >= MIN_TEXT_LENGTH;
  }

  if (!success) {
    const rawText = new TextDecoder().decode(buf);
    const readableParts = rawText.match(/[a-zA-Z][a-zA-Z\s.,!?@&*()\-:;'"/\\]{3,}/g) || [];
    text = readableParts.join(" ");
  }

  return text;
}

async function extractFromPdfOcr(buf: Uint8Array): Promise<string> {
  try {
    const tesseract = await import("tesseract.js");
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const pdfDoc = await pdfjs.getDocument({ data: buf }).promise;
    const maxPages = Math.min(pdfDoc.numPages, 5);
    const ocrText: string[] = [];

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });

      let canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
      let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

      if (typeof OffscreenCanvas !== "undefined") {
        canvas = new OffscreenCanvas(viewport.width, viewport.height);
        ctx = canvas.getContext("2d");
      } else if (typeof document !== "undefined") {
        canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        ctx = canvas.getContext("2d");
      }

      if (!canvas || !ctx) break;

      await page.render({ canvasContext: ctx as any, viewport } as any).promise;

      let imageData: ImageData;
      if ("getImageData" in ctx) {
        imageData = ctx.getImageData(0, 0, viewport.width, viewport.height);
      } else {
        continue;
      }

      const { data: ocrData } = await tesseract.recognize(imageData as any, "eng");
      if (ocrData?.text?.trim()) ocrText.push(ocrData.text.trim());
    }

    return ocrText.join("\n\n");
  } catch (err) {
    return "";
  }
}

export async function extractResumeText(
  buf: Uint8Array,
  fileName: string,
  mimeType?: string,
): Promise<{ text: string; fileType: DetectedFileType }> {
  const fileType = detectFileType(buf, fileName, mimeType);

  if (fileType === "unknown") {
    throw new ResumeScanError(
      "UNSUPPORTED_FILE_TYPE",
      "Unsupported file type. Please upload a PDF, DOCX, or text file.",
    );
  }

  let raw = "";

  try {
    switch (fileType) {
      case "pdf":
        raw = await extractFromPdf(buf);
        break;
      case "docx":
        raw = await extractFromDocx(buf);
        break;
      case "doc":
        throw new ResumeScanError(
          "UNSUPPORTED_FILE_TYPE",
          "Legacy .doc files are not supported. Please convert to PDF or DOCX.",
        );
      case "text":
        raw = new TextDecoder().decode(buf);
        break;
    }
  } catch (err) {
    if (err instanceof ResumeScanError) throw err;
    throw new ResumeScanError(
      "FILE_PARSE_FAILED",
      "Could not extract text from your resume file. Please try a different format (PDF or DOCX).",
      err,
    );
  }

  const text = cleanText(raw);

  if (text.length < MIN_TEXT_LENGTH) {
    throw new ResumeScanError(
      "INSUFFICIENT_TEXT",
      "Could not extract enough text from the resume file. If this is a scanned PDF, try uploading a text-based PDF or DOCX instead.",
    );
  }

  if (!looksLikeResumeText(text)) {
    throw new ResumeScanError(
      "NOT_A_RESUME",
      "The uploaded file does not appear to be a resume. Please upload a document containing your work experience, education, and skills.",
    );
  }

  return { text, fileType };
}

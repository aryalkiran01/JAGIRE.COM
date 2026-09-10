import { createWorker } from "tesseract.js";

export type SupportedFileType = "pdf" | "docx" | "image" | "unknown";

export interface ExtractedResume {
  text: string;
  source: "pdf_text" | "pdf_ocr" | "image_ocr" | "docx_text" | "plain_text";
  pagesProcessed?: number;
  mimeType: string;
}

/**
 * Detect file type using magic numbers (file signature), MIME type, and file name.
 */
export function detectFileType(
  buffer: Uint8Array,
  fileName?: string,
  mimeType?: string,
): { type: SupportedFileType; mime: string } {
  const name = (fileName ?? "").toLowerCase();
  const mime = (mimeType ?? "").toLowerCase();

  // 1. Check Magic Bytes
  if (buffer.length >= 4) {
    // PDF magic bytes: %PDF (0x25 0x50 0x44 0x46)
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return { type: "pdf", mime: "application/pdf" };
    }

    // DOCX magic bytes: PK.. (0x50 0x4B 0x03 0x04)
    if (
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
      (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08)
    ) {
      if (name.endsWith(".docx") || mime.includes("wordprocessingml") || mime.includes("docx")) {
        return {
          type: "docx",
          mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        };
      }
    }

    // JPEG magic bytes: 0xFF 0xD8 0xFF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { type: "image", mime: "image/jpeg" };
    }

    // PNG magic bytes: 0x89 0x50 0x4E 0x47 (0x89 'P' 'N' 'G')
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return { type: "image", mime: "image/png" };
    }

    // WebP magic bytes: 'RIFF' .... 'WEBP'
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return { type: "image", mime: "image/webp" };
    }
  }

  // 2. Check MIME type
  if (mime.includes("pdf")) return { type: "pdf", mime: "application/pdf" };
  if (mime.includes("wordprocessingml") || mime.includes("docx")) {
    return {
      type: "docx",
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }
  if (mime.startsWith("image/")) {
    return { type: "image", mime };
  }

  // 3. Check filename extension
  if (name.endsWith(".pdf")) return { type: "pdf", mime: "application/pdf" };
  if (name.endsWith(".docx")) {
    return {
      type: "docx",
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return { type: "image", mime: "image/jpeg" };
  }
  if (name.endsWith(".png")) {
    return { type: "image", mime: "image/png" };
  }
  if (name.endsWith(".webp")) {
    return { type: "image", mime: "image/webp" };
  }

  return { type: "unknown", mime: mime || "application/octet-stream" };
}

/**
 * Perform OCR on an image buffer using Gemini Vision (if configured) with Tesseract.js fallback.
 */
async function performImageOCR(imageBuffer: Uint8Array, mimeType: string): Promise<string> {
  // Strategy 1: If GEMINI_API_KEY is available, use Gemini Vision for high accuracy
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const base64Data = Buffer.from(imageBuffer).toString("base64");
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "You are an expert OCR and resume parser. Transcribe and extract all text, headings, sections, dates, job titles, bullet points, and skills from this resume image accurately. Preserve layout structure. Return plain text only.",
                },
                {
                  inlineData: {
                    mimeType: mimeType || "image/png",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const extracted = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (extracted && extracted.trim().length >= 30) {
          console.log("[OCR] Extracted text via Gemini Vision:", extracted.length, "characters");
          return extracted.trim();
        }
      }
    } catch (geminiError) {
      console.warn("[OCR] Gemini Vision OCR failed, falling back to Tesseract.js:", geminiError);
    }
  }

  // Strategy 2: Local Tesseract.js OCR
  console.log("[OCR] Running local Tesseract.js OCR engine...");
  const worker = await createWorker("eng");
  try {
    const ret = await worker.recognize(Buffer.from(imageBuffer));
    const text = ret.data.text ?? "";
    console.log("[OCR] Tesseract extracted:", text.length, "characters");
    return text.trim();
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract text from a PDF with two-stage strategy:
 * Stage 1: Fast direct text extraction (unpdf / pdf-parse).
 * Stage 2: Scanned PDF OCR fallback (extract page images and OCR sequentially).
 */
async function extractTextFromPDF(pdfBuffer: Uint8Array): Promise<ExtractedResume> {
  let text = "";
  let extractedSuccessfully = false;

  // ── Stage 1: Direct Text Extraction ─────────────────────────────────────────

  // Try unpdf first
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(pdfBuffer);
    const out = await extractText(pdf, { mergePages: true });
    text = Array.isArray(out.text) ? out.text.join("\n") : (out.text as string);
    // Ensure we extracted substantive selectable text (at least 60 characters with words)
    if (text && text.trim().length >= 60 && /[a-zA-Z]{3,}/.test(text)) {
      extractedSuccessfully = true;
      return {
        text: text.trim(),
        source: "pdf_text",
        mimeType: "application/pdf",
      };
    }
  } catch (unpdfErr) {
    console.warn("[PDF Parse] unpdf extractText warning:", unpdfErr);
  }

  // Try pdf-parse as secondary text parser
  if (!extractedSuccessfully) {
    try {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = pdfParseModule.default ?? pdfParseModule;
      const pdfData = await pdfParse(Buffer.from(pdfBuffer));
      text = pdfData.text ?? "";
      if (text && text.trim().length >= 60 && /[a-zA-Z]{3,}/.test(text)) {
        return {
          text: text.trim(),
          source: "pdf_text",
          mimeType: "application/pdf",
        };
      }
    } catch (parseErr) {
      console.warn("[PDF Parse] pdf-parse warning:", parseErr);
    }
  }

  // ── Stage 2: Scanned PDF OCR Fallback ───────────────────────────────────────
  console.log(
    "[PDF Parse] PDF has insufficient selectable text (<60 chars). Activating Scanned PDF OCR fallback...",
  );

  try {
    const { extractImages, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(pdfBuffer);
    const numPages = Math.min(pdf.numPages || 1, 10); // Limit to first 10 pages for safety
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      console.log(`[PDF OCR] Processing PDF page ${pageNum}/${numPages}...`);
      try {
        const images = await extractImages(pdf, pageNum);
        if (images && images.length > 0) {
          // Sort or pick largest image on the page (usually the scanned document page)
          for (const img of images) {
            const imgBuffer = new Uint8Array(img.data);
            if (imgBuffer.length > 500) {
              const detectedImg = detectFileType(imgBuffer);
              const mime = detectedImg.mime.startsWith("image/") ? detectedImg.mime : "image/png";
              const pageOcrText = await performImageOCR(imgBuffer, mime);
              if (pageOcrText) {
                pageTexts.push(`--- Page ${pageNum} ---\n` + pageOcrText);
              }
            }
          }
        }
      } catch (pageErr) {
        console.warn(`[PDF OCR] Error extracting images from page ${pageNum}:`, pageErr);
      }
    }

    if (pageTexts.length > 0) {
      const combined = pageTexts.join("\n\n").trim();
      if (combined.length >= 30) {
        return {
          text: combined,
          source: "pdf_ocr",
          pagesProcessed: pageTexts.length,
          mimeType: "application/pdf",
        };
      }
    }
  } catch (ocrFallbackErr) {
    console.warn("[PDF OCR] Page image extraction fallback failed:", ocrFallbackErr);
  }

  // Fallback: If no images could be extracted, try Gemini directly with application/pdf
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      console.log("[PDF OCR] Attempting full PDF OCR via Gemini multimodal...");
      const base64Data = Buffer.from(pdfBuffer).toString("base64");
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "You are an expert OCR and resume parser. Transcribe and extract all readable text, contact details, experience, skills, and education from this scanned PDF resume. Return clear text.",
                },
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const extracted = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (extracted && extracted.trim().length >= 30) {
          return {
            text: extracted.trim(),
            source: "pdf_ocr",
            mimeType: "application/pdf",
          };
        }
      }
    } catch (e) {
      console.warn("[PDF OCR] Multimodal PDF Gemini extraction error:", e);
    }
  }

  if (text && text.trim().length > 0) {
    return {
      text: text.trim(),
      source: "pdf_text",
      mimeType: "application/pdf",
    };
  }

  throw new Error(
    "We couldn't extract enough readable text from this PDF. Please ensure the document is clear and legible.",
  );
}

/**
 * Universal Resume Parser: accepts PDF, DOCX, JPG, JPEG, PNG, WebP
 */
export async function parseResumeDocument(
  buffer: Uint8Array,
  fileName?: string,
  mimeType?: string,
): Promise<ExtractedResume> {
  const { type, mime } = detectFileType(buffer, fileName, mimeType);

  console.log(`[ResumeParser] Detected file: name="${fileName}", mime="${mime}", type="${type}"`);

  if (type === "docx") {
    const mammoth = await import("mammoth");
    const res = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    const text = (res.value ?? "").trim();
    if (text.length < 30) {
      throw new Error(
        "We couldn't read enough text from this DOCX resume. Please ensure the file contains text content.",
      );
    }
    return {
      text,
      source: "docx_text",
      mimeType: mime,
    };
  }

  if (type === "image") {
    const text = await performImageOCR(buffer, mime);
    if (!text || text.trim().length < 30) {
      throw new Error(
        "We couldn't read enough text from this image resume. Please upload a higher resolution or clearer image.",
      );
    }
    return {
      text: text.trim(),
      source: "image_ocr",
      mimeType: mime,
    };
  }

  if (type === "pdf") {
    return await extractTextFromPDF(buffer);
  }

  // Fallback text decode attempt
  try {
    const decoded = new TextDecoder().decode(buffer).trim();
    if (decoded.length >= 50 && /[a-zA-Z]{3,}/.test(decoded)) {
      return {
        text: decoded,
        source: "plain_text",
        mimeType: mime || "text/plain",
      };
    }
  } catch {
    // Ignore decode error
  }

  throw new Error("Unsupported format. Supported formats: PDF, DOCX, JPG, PNG, and WebP.");
}

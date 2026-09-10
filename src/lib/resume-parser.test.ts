import { describe, it, expect } from "vitest";
import { detectFileType, parseResumeDocument } from "./resume-parser.server";

describe("Resume Parser: File Type Detection & Validation", () => {
  it("accurately identifies PDF files by header magic bytes and extension", () => {
    // %PDF-
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const detected = detectFileType(pdfBytes, "my-resume.pdf", "application/pdf");
    expect(detected.type).toBe("pdf");
    expect(detected.mime).toBe("application/pdf");
  });

  it("accurately identifies DOCX files by zip PK header magic bytes and extension", () => {
    // PK\x03\x04
    const docxBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    const detected = detectFileType(
      docxBytes,
      "resume.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(detected.type).toBe("docx");
  });

  it("accurately identifies JPEG image files by magic bytes", () => {
    // \xFF\xD8\xFF
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const detected = detectFileType(jpegBytes, "scanned-resume.jpg", "image/jpeg");
    expect(detected.type).toBe("image");
    expect(detected.mime).toBe("image/jpeg");
  });

  it("accurately identifies PNG image files by magic bytes", () => {
    // \x89PNG
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const detected = detectFileType(pngBytes, "resume-photo.png", "image/png");
    expect(detected.type).toBe("image");
    expect(detected.mime).toBe("image/png");
  });

  it("accurately identifies WebP image files by RIFF...WEBP magic bytes", () => {
    // RIFF....WEBP
    const webpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    const detected = detectFileType(webpBytes, "resume.webp", "image/webp");
    expect(detected.type).toBe("image");
    expect(detected.mime).toBe("image/webp");
  });

  it("safely handles plain text fallback", async () => {
    const textSample =
      "John Doe\nSenior Software Engineer\nKathmandu, Nepal\nSkills: React, TypeScript, Node.js, Python\nExperience: 5 years at Tech Corp building web applications.\nEducation: BSc in Computer Science, Tribhuvan University.";
    const textBytes = new TextEncoder().encode(textSample);

    const result = await parseResumeDocument(textBytes, "resume.txt", "text/plain");
    expect(result.text).toContain("John Doe");
    expect(result.text).toContain("React, TypeScript");
    expect(result.source).toBe("plain_text");
  });

  it("rejects unsupported file formats gracefully", async () => {
    const binaryBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
    await expect(
      parseResumeDocument(binaryBytes, "corrupted.exe", "application/x-msdownload"),
    ).rejects.toThrow(/Unsupported format/);
  });
});

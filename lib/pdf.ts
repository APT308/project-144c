// Import the internal lib path directly — pdf-parse's package-root index.js
// contains a `!module.parent` debug branch that misfires under webpack
// bundling and tries to read a bundled test fixture file.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text.trim();
}

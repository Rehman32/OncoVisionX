import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Saliency Map Storage Utility
 * 
 * Decodes a base64-encoded PNG string from the FastAPI ML service
 * and persists it as a file on the local filesystem.
 * Returns the public-facing URL path for the saved file.
 */

const SALIENCY_DIR = path.join(__dirname, '..', '..', 'uploads', 'saliency');

/**
 * Ensures the saliency output directory exists (creates it if not).
 */
function ensureDirectoryExists(): void {
  if (!fs.existsSync(SALIENCY_DIR)) {
    fs.mkdirSync(SALIENCY_DIR, { recursive: true });
  }
}

/**
 * Saves a base64-encoded PNG string to disk and returns the public URL path.
 * 
 * @param base64String - The raw base64 PNG data from FastAPI (no data URI prefix)
 * @returns The public URL path, e.g. `/static/saliency/abc123.png`
 */
export async function saveSaliencyMap(base64String: string): Promise<string> {
  ensureDirectoryExists();

  // Strip optional data URI prefix (e.g., "data:image/png;base64,")
  const cleanBase64 = base64String.replace(/^data:image\/\w+;base64,/, '');

  const buffer = Buffer.from(cleanBase64, 'base64');
  const fileName = `${uuidv4()}.png`;
  const filePath = path.join(SALIENCY_DIR, fileName);

  await fs.promises.writeFile(filePath, buffer);

  // Return the URL path that maps to express.static in app.ts
  return `/static/saliency/${fileName}`;
}

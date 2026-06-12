import crypto from "crypto";

// ENCRYPTION_KEY must be a 64-character hex string (32 bytes)
// Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY is not defined");
  if (key.length !== 64) throw new Error("ENCRYPTION_KEY must be 64 hex characters");
  return Buffer.from(key, "hex");
}

// Encrypt a string using AES-256-CBC
export function encrypt(text: string): string {
  if (!text) return text;

  try {
    const iv      = crypto.randomBytes(16);
    const cipher  = crypto.createCipheriv("aes-256-cbc", getKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);

    // Return iv:encrypted as hex string
    return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
  } catch (err) {
    throw new Error(`Encryption failed: ${err}`);
  }
}

// Decrypt a string encrypted with encrypt()
export function decrypt(text: string): string {
  if (!text) return text;

  // If not in encrypted format, return as-is (backwards compatibility)
  if (!text.includes(":")) return text;

  try {
    const [ivHex, encryptedHex] = text.split(":");
    const iv        = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher  = crypto.createDecipheriv("aes-256-cbc", getKey(), iv);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  } catch (err) {
    throw new Error(`Decryption failed: ${err}`);
  }
}

// Check if a string is already encrypted
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  const parts = text.split(":");
  return parts.length === 2 && parts[0].length === 32;
}
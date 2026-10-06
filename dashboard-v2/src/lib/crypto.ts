import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const MASTER_KEY = process.env.MASTER_KEY || "";

if (!MASTER_KEY || MASTER_KEY.length < 64) {
  throw new Error("MASTER_KEY must be set (64+ hex chars). Generate: openssl rand -hex 32");
}

const key = Buffer.from(MASTER_KEY.slice(0, 64), "hex");

export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return {
    encrypted: encrypted + authTag.toString("hex"),
    iv: iv.toString("hex"),
  };
}

export function decrypt(encrypted: string, iv: string): string {
  const ivBuf = Buffer.from(iv, "hex");
  const data = Buffer.from(encrypted, "hex");
  const authTag = data.subarray(data.length - 16);
  const ciphertext = data.subarray(0, data.length - 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuf);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, undefined, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function maskKey(k: string): string {
  if (k.length <= 8) return "****";
  return k.substring(0, 4) + "..." + k.substring(k.length - 4);
}

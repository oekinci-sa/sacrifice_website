import { createHmac } from "crypto";

const SECRET = process.env.QUEUE_ACCESS_SECRET;

export function hashQueueCode(code: string): string {
  if (!SECRET) throw new Error("QUEUE_ACCESS_SECRET env var is not set");
  return createHmac("sha256", SECRET).update(code).digest("hex");
}

export function hashIp(ip: string): string {
  if (!SECRET) throw new Error("QUEUE_ACCESS_SECRET env var is not set");
  return createHmac("sha256", SECRET + ":ip").update(ip).digest("hex");
}

export type PageKey = "slaughter" | "butcher" | "delivery";

export const PAGE_KEYS: PageKey[] = ["slaughter", "butcher", "delivery"];

export function isPageKey(v: unknown): v is PageKey {
  return PAGE_KEYS.includes(v as PageKey);
}

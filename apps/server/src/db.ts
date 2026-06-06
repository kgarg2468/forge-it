import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Small JSON helpers for the String-typed JSON columns.
export function toJson(v: unknown): string {
  return JSON.stringify(v ?? null);
}
export function fromJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

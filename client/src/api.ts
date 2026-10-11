export type User = { id: string; name: string; role: "patient" | "clinician" | "admin" };
export type Risk = { condition: string; score: number; max: number; level: 0 | 1 | 2; bands: [number, number]; factors: { label: string; points: number }[] };
export type Results = { bmi: number; risks: Risk[]; seeClinician: boolean; tips: string[] };
export type Assessment = { id: string; createdAt: string; results: Results };

import { mockApi } from "./mock";

export const MOCK = import.meta.env.VITE_MOCK === "true";
console.info(MOCK ? "Using mock API" : "Using real API at /api");

export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  if (MOCK) return (await mockApi(path, method, body)) as T;
  const res = await fetch("/api" + path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Something went wrong");
  return data as T;
}

export const LEVELS = ["Lower", "Moderate", "Higher"] as const;

// lib/api.ts — typed client for the FastAPI backend

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface GitaResponse {
  insight:     string;
  principle:   string;
  verse:       string;
  explanation: string;
  actions:     string[];
}

export async function analyzeQuery(query: string): Promise<GitaResponse> {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ query }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

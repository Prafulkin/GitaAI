"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeQuery, type GitaResponse } from "../lib/api";

// ── Suggestion chips ──────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "I feel lazy and distracted",
  "I'm afraid of failing",
  "I'm angry at someone I love",
  "I don't know my purpose",
  "I'm overwhelmed with work",
  "I'm grieving a loss",
];

// ── Card data config ──────────────────────────────────────────────────────────
const CARDS = [
  { key: "insight",     label: "Insight",     icon: "✦", color: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800" },
  { key: "principle",   label: "Principle",   icon: "◈", color: "bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800" },
  { key: "verse",       label: "Verse",       icon: "◎", color: "bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800" },
  { key: "explanation", label: "Explanation", icon: "◉", color: "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" },
] as const;


// ── Component ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<GitaResponse | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [dark,    setDark]    = useState(false);

  async function handleSubmit(q = query) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeQuery(q.trim());
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={dark ? "dark" : ""}>
      <main className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300 px-4 py-10">

        {/* Header */}
        <div className="max-w-xl mx-auto flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              Gita AI
            </h1>
            <p className="text-sm text-stone-400 dark:text-stone-500 mt-0.5">
              Timeless wisdom for modern struggles
            </p>
          </div>
          <button
            onClick={() => setDark(d => !d)}
            className="w-9 h-9 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Toggle theme"
          >
            {dark ? "☀" : "☽"}
          </button>
        </div>

        {/* Input card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm p-5 mb-4"
        >
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="What's on your mind? Share your struggle or question…"
            rows={3}
            className="w-full resize-none text-stone-800 dark:text-stone-200 bg-transparent text-base placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none leading-relaxed"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !query.trim()}
              className="px-5 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
            >
              {loading ? "Seeking wisdom…" : "Ask the Gita"}
            </button>
          </div>
        </motion.div>

        {/* Suggestion chips */}
        <div className="max-w-xl mx-auto flex flex-wrap gap-2 mb-10">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setQuery(s); handleSubmit(s); }}
              className="px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-xl mx-auto mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-xl mx-auto space-y-3"
            >
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Response cards */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="max-w-xl mx-auto space-y-3"
            >
              {CARDS.map(({ key, label, icon, color }, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-2xl border p-5 ${color}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono opacity-60">{icon}</span>
                    <span className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400">
                      {label}
                    </span>
                  </div>
                  <p className="text-stone-800 dark:text-stone-200 text-base leading-relaxed">
                    {result[key]}
                  </p>
                </motion.div>
              ))}

              {/* Actions card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: CARDS.length * 0.08 }}
                className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono opacity-60">▸</span>
                  <span className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400">
                    Action Steps
                  </span>
                </div>
                <ol className="space-y-2">
                  {result.actions.map((action, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xs font-medium text-stone-500">
                        {idx + 1}
                      </span>
                      {action}
                    </li>
                  ))}
                </ol>
              </motion.div>

              {/* Reset */}
              <button
                onClick={() => { setResult(null); setQuery(""); }}
                className="w-full py-3 text-sm text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 transition-colors"
              >
                Ask another question
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

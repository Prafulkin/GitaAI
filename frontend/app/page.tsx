"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeQuery, type GitaResponse } from "../lib/api";

const SUGGESTIONS = [
  "I feel lazy and distracted",
  "I'm afraid of failing",
  "I'm angry at someone I love",
  "I don't know my purpose",
  "I'm overwhelmed with work",
  "I'm grieving a loss",
];

const CARDS = [
  { key: "insight", label: "Insight", icon: "✦" },
  { key: "principle", label: "Principle", icon: "◈" },
  { key: "verse", label: "Verse", icon: "◎" },
  { key: "explanation", label: "Explanation", icon: "◉" },
] as const;

const CARD_CLASS: Record<string, string> = {
  insight: "insight-card",
  principle: "principle-card",
  verse: "verse-card",
  explanation: "explanation-card",
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GitaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(false);

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
    <div className={dark ? "app dark" : "app"}>
      <main className="page-shell">
        <header className="page-header">
          <div>
            <h1>Gita AI</h1>
            <p>Timeless wisdom for modern struggles</p>
          </div>
          <button
            className="theme-toggle"
            onClick={() => setDark(d => !d)}
            aria-label="Toggle theme"
          >
            {dark ? "☀" : "☽"}
          </button>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card input-card"
        >
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="What's on your mind? Share your struggle or question…"
            rows={4}
            className="question-input"
          />
          <div className="actions-row">
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !query.trim()}
              className="primary-button"
            >
              {loading ? "Seeking wisdom…" : "Ask the Gita"}
            </button>
          </div>
        </motion.section>

        <div className="chip-row">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => {
                setQuery(s);
                handleSubmit(s);
              }}
              className="chip"
            >
              {s}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card error-card"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="loading-stack"
            >
              {[...Array(4)].map((_, i) => (
                <div key={i} className="loading-block" />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="result-stack"
            >
              {CARDS.map(({ key, label, icon }, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`card result-card ${CARD_CLASS[key]}`}
                >
                  <div className="card-header">
                    <span className="card-icon">{icon}</span>
                    <span className="card-title">{label}</span>
                  </div>
                  <p className="card-body">{result[key]}</p>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: CARDS.length * 0.08 }}
                className="card action-card"
              >
                <div className="card-header">
                  <span className="card-icon">▸</span>
                  <span className="card-title">Action Steps</span>
                </div>
                <ol className="action-list">
                  {result.actions.map((action, idx) => (
                    <li key={idx} className="action-item">
                      <span className="action-index">{idx + 1}</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>

              <button
                onClick={() => {
                  setResult(null);
                  setQuery("");
                }}
                className="secondary-button"
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

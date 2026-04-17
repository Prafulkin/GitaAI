"""
Bhagavad Gita RAG Pipeline
- Loads PDF, chunks text, embeds with sentence-transformers, stores in FAISS
- Retrieves top-k chunks for a query, sends to local Ollama model
- Returns structured JSON output
"""

import json
import os
import re
import requests
from pathlib import Path

import faiss
import numpy as np
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer

try:
    from .intelligence_prompt import INTELLIGENCE_PROMPT
except ImportError:
    from intelligence_prompt import INTELLIGENCE_PROMPT

# ── Config ──────────────────────────────────────────────────────────────────
PDF_PATH      = Path("data/bhagavad_gita.pdf")
INDEX_PATH    = Path("data/faiss.index")
CHUNKS_PATH   = Path("data/chunks.json")
EMBED_MODEL   = "all-MiniLM-L6-v2"
OLLAMA_URL    = os.environ.get("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL  = os.environ.get("OLLAMA_MODEL", "llama3")  # swap with any model you have pulled
TOP_K         = 5
CHUNK_SIZE    = 400               # characters per chunk
CHUNK_OVERLAP = 80

# ── Singleton state ──────────────────────────────────────────────────────────
_embedder: SentenceTransformer | None = None
_index:    faiss.Index | None         = None
_chunks:   list[str] | None           = None


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EMBED_MODEL)
    return _embedder


# ── 1. PDF → chunks ──────────────────────────────────────────────────────────
def load_and_chunk_pdf(path: Path = PDF_PATH) -> list[str]:
    """Extract text from PDF and split into overlapping chunks."""
    reader = PdfReader(str(path))
    raw = " ".join(
        page.extract_text() or "" for page in reader.pages
    )
    # Clean whitespace / special chars
    raw = re.sub(r"\s+", " ", raw).strip()

    chunks, start = [], 0
    while start < len(raw):
        end = start + CHUNK_SIZE
        chunks.append(raw[start:end])
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


# ── 2. Embed + build FAISS index ─────────────────────────────────────────────
def build_index(chunks: list[str]) -> faiss.Index:
    """Create and persist a FAISS flat-L2 index from chunk embeddings."""
    embedder = _get_embedder()
    vecs = embedder.encode(chunks, show_progress_bar=True, convert_to_numpy=True)
    vecs = vecs.astype(np.float32)

    dim = vecs.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(vecs)

    # Persist
    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(INDEX_PATH))
    CHUNKS_PATH.write_text(json.dumps(chunks, ensure_ascii=False), encoding="utf-8")

    return index


def load_or_build() -> tuple[faiss.Index, list[str]]:
    """Load existing index / chunks, or build from PDF if not present."""
    global _index, _chunks
    if _index is not None and _chunks is not None:
        return _index, _chunks

    if INDEX_PATH.exists() and CHUNKS_PATH.exists():
        _index  = faiss.read_index(str(INDEX_PATH))
        _chunks = json.loads(CHUNKS_PATH.read_text(encoding="utf-8"))
    else:
        _chunks = load_and_chunk_pdf()
        _index  = build_index(_chunks)

    return _index, _chunks


# ── 3. Retrieve relevant chunks ──────────────────────────────────────────────
def retrieve(query: str, k: int = TOP_K) -> list[str]:
    index, chunks = load_or_build()
    embedder = _get_embedder()

    q_vec = embedder.encode([query], convert_to_numpy=True).astype(np.float32)
    _, idxs = index.search(q_vec, k)
    return [chunks[i] for i in idxs[0] if i < len(chunks)]


# ── 4. LLM call via Ollama ───────────────────────────────────────────────────
_SYSTEM = INTELLIGENCE_PROMPT

def query_llm(user_query: str, context_chunks: list[str]) -> dict:
    context = "\n\n---\n\n".join(context_chunks)
    prompt  = f"{_SYSTEM}\n\nContext from Bhagavad Gita:\n{context}\n\nUser question: {user_query}"

    resp = requests.post(
        OLLAMA_URL,
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
        timeout=300,  # 5 minutes - increased for CPU inference
    )

    if resp.status_code != 200:
        error_text = resp.text
        try:
            error_json = resp.json()
            error_text = error_json.get("error", error_json.get("message", error_text))
        except ValueError:
            pass

        if resp.status_code == 404 and "model" in error_text.lower():
            raise ValueError(
                f"Ollama model not found: '{OLLAMA_MODEL}'.\n"
                "Run `ollama list` to see available models, then set OLLAMA_MODEL to a pulled model name."
            )

        raise ValueError(f"Ollama request failed ({resp.status_code}): {error_text}")

    raw_text = resp.json().get("response", "")

    # Extract JSON — handle models that wrap in backticks
    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if not match:
        raise ValueError(f"LLM did not return valid JSON:\n{raw_text}")
    return json.loads(match.group())


# ── 5. Public entry point ────────────────────────────────────────────────────
def analyze(query: str) -> dict:
    """Full RAG → LLM pipeline. Returns structured Gita insight."""
    chunks  = retrieve(query)
    result  = query_llm(query, chunks)
    # Guarantee all keys exist
    return {
        "insight":     result.get("insight", ""),
        "principle":   result.get("principle", ""),
        "verse":       result.get("verse", ""),
        "explanation": result.get("explanation", ""),
        "actions":     result.get("actions", []),
    }


# ── CLI test ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    q = " ".join(sys.argv[1:]) or "I feel lazy and unmotivated today"
    print(json.dumps(analyze(q), indent=2, ensure_ascii=False))

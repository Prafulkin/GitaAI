"""
Bhagavad Gita AI — FastAPI Backend
Exposes POST /analyze → calls RAG pipeline → returns structured JSON
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from rag.pipeline import analyze


# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Gita AI",
    description="Local AI guidance system based on the Bhagavad Gita",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],   # Next.js dev server
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ── Schemas ──────────────────────────────────────────────────────────────────
class QueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500, example="I feel lazy and distracted")


class GitaResponse(BaseModel):
    insight:     str
    principle:   str
    verse:       str
    explanation: str
    actions:     list[str]


# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=GitaResponse)
def analyze_query(body: QueryRequest):
    """
    Accepts a natural-language question or emotional state.
    Returns Bhagavad Gita-based structured guidance.
    """
    try:
        result = analyze(body.query)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {exc}")


# ── Entrypoint ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, timeout_keep_alive=300)

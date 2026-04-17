# Gita AI — Local Bhagavad Gita Guidance System

A privacy-first, offline AI system that delivers structured Bhagavad Gita wisdom.
No cloud APIs. Runs entirely on your machine via Ollama.

---

## Stack

| Layer     | Tech                              |
|-----------|-----------------------------------|
| LLM       | Ollama (llama3 or any local model)|
| Embeddings| sentence-transformers             |
| Vector DB | FAISS                             |
| Backend   | FastAPI + Python 3.11+            |
| Frontend  | Next.js 14 + Tailwind + shadcn/ui |
| Animation | Framer Motion                     |

---

## Setup

### 1. Prerequisites

```bash
# Install Ollama
brew install ollama          # macOS
# or https://ollama.com/download

ollama pull llama3           # ~4.7 GB
```

### 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Place your Bhagavad Gita PDF at:
mkdir -p data
cp /path/to/bhagavad_gita.pdf data/

# Build the FAISS index (first run only — ~60 seconds)
python rag/pipeline.py "What is duty?"

# Start the API server
python main.py
# → http://localhost:8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
gita_ai/
├── backend/
│   ├── main.py                  # FastAPI app
│   ├── requirements.txt
│   ├── data/
│   │   ├── bhagavad_gita.pdf   # ← add your PDF here
│   │   ├── faiss.index         # auto-generated
│   │   └── chunks.json         # auto-generated
│   └── rag/
│       ├── pipeline.py          # PDF → chunks → FAISS → Ollama
│       └── intelligence_prompt.py  # Enhanced system prompt
└── frontend/
    ├── app/
    │   └── page.tsx             # Main UI (all phases)
    └── lib/
        └── api.ts               # Typed API client
```

---

## API

### `POST /analyze`

**Request:**
```json
{ "query": "I feel lazy and distracted" }
```

**Response:**
```json
{
  "insight":     "You are experiencing tamas — the guna of inertia — and the Gita offers action as its antidote.",
  "principle":   "Nishkama Karma — action without attachment to results",
  "verse":       "3:19",
  "explanation": "Krishna tells Arjuna that action performed without clinging to its fruits purifies the mind. Your lethargy grows when you focus on outcomes instead of the next single step. The cure is motion itself.",
  "actions": [
    "Choose the one task you have been avoiding most. Set a 25-minute timer and do only that — close every other tab.",
    "After the timer, write one sentence: what you completed and how it felt. This anchors the habit.",
    "Commit to one physical action before checking your phone tomorrow morning — even 5 minutes of walking."
  ]
}
```

---

## Development Order

1. `python rag/pipeline.py "test query"` — verify RAG works in CLI
2. `python main.py` — verify API at localhost:8000/docs
3. `npm run dev` — verify UI loads
4. Submit a real query end-to-end
5. Tune the intelligence prompt for better output quality

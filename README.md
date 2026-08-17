# ResearchMind — Multi-Agent AI Research System

## Quick Start

### 1. Install Python dependencies
```bash
cd ai
pip install -r requirements.txt
```

### 2. Start the FastAPI backend
```bash
cd ai
uvicorn server:app --reload --port 8000
```

### 3. Start the React UI (in a separate terminal)
```bash
cd ui
npm install       # first time only
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Architecture

```
ui/               React + Tailwind CSS + Framer Motion frontend
ai/
  server.py       FastAPI backend — wraps pipeline.py as SSE stream
  pipeline.py     Original 4-step research pipeline
  agents.py       Search agent, Reader agent, Writer chain, Critic chain
  tools.py        web_search (Tavily) + scrape_webpage (BeautifulSoup)
```

## How it works

1. **Search Agent** — Queries Tavily for 5 relevant sources
2. **Reader Agent** — Picks the best URL and scrapes full content
3. **Writer Chain** — Synthesises a structured Markdown report
4. **Critic Chain** — Scores the report 1–10 with strengths and improvements

Each step streams progress to the UI in real-time via Server-Sent Events.

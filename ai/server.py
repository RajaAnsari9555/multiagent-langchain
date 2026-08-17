import asyncio
import json
import queue
import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents import build_reader_agent, build_search_agent, writer_chain, critics_chain

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TopicRequest(BaseModel):
    topic: str


def run_pipeline_with_queue(topic: str, q: queue.Queue):
    """Run the research pipeline and push SSE events into the queue."""
    try:
        state = {}

        # ── Step 1: Search ──────────────────────────────────────────────────
        q.put({"step": 1, "status": "running", "label": "Search Agent", "message": f"Searching the web for: {topic}"})

        search_agent = build_search_agent()
        search_result = search_agent.invoke({
            "messages": [("user", f"Find recent, reliable and detailed information about {topic}")]
        })
        state["search_results"] = search_result["messages"][-1].content

        q.put({
            "step": 1,
            "status": "done",
            "label": "Search Agent",
            "message": "Search complete.",
            "data": state["search_results"],
        })

        # ── Step 2: Reader / Scraper ────────────────────────────────────────
        q.put({"step": 2, "status": "running", "label": "Reader Agent", "message": "Scraping top resources..."})

        reader_agent = build_reader_agent()
        reader_result = reader_agent.invoke({
            "messages": [(
                "user",
                f"Based on the following search results about '{topic}', "
                f"pick the most relevant URL and scrape it for deeper content.\n\n"
                f"Search Results:\n{state['search_results'][:800]}"
            )]
        })
        state["scraped_content"] = reader_result["messages"][-1].content

        q.put({
            "step": 2,
            "status": "done",
            "label": "Reader Agent",
            "message": "Scraping complete.",
            "data": state["scraped_content"],
        })

        # ── Step 3: Writer ──────────────────────────────────────────────────
        q.put({"step": 3, "status": "running", "label": "Writer Chain", "message": "Writing research report (may retry if rate-limited)…"})

        research_combined = (
            f"SEARCH RESULTS:\n{state['search_results']}\n\n"
            f"DETAILED SCRAPED CONTENT:\n{state['scraped_content']}"
        )
        state["report"] = writer_chain.invoke({"topic": topic, "research": research_combined})

        q.put({
            "step": 3,
            "status": "done",
            "label": "Writer Chain",
            "message": "Report written.",
            "data": state["report"],
        })

        # ── Step 4: Critic ──────────────────────────────────────────────────
        q.put({"step": 4, "status": "running", "label": "Critic Chain", "message": "Reviewing report quality (may retry if rate-limited)…"})

        state["feedback"] = critics_chain.invoke({"report": state["report"]})

        q.put({
            "step": 4,
            "status": "done",
            "label": "Critic Chain",
            "message": "Review complete.",
            "data": state["feedback"],
        })

        q.put({"step": 0, "status": "complete", "label": "Pipeline", "message": "Research pipeline finished!"})

    except Exception as e:
        q.put({"step": -1, "status": "error", "label": "Error", "message": str(e)})
    finally:
        q.put(None)  # sentinel


@app.post("/research")
async def research_stream(request: TopicRequest):
    q: queue.Queue = queue.Queue()

    # Run blocking pipeline in a thread
    thread = threading.Thread(target=run_pipeline_with_queue, args=(request.topic, q), daemon=True)
    thread.start()

    async def event_generator():
        loop = asyncio.get_event_loop()
        while True:
            # Poll the queue without blocking the event loop
            try:
                event = await loop.run_in_executor(None, q.get, True, 0.1)
            except queue.Empty:
                continue

            if event is None:
                break

            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/health")
async def health():
    return {"status": "ok"}

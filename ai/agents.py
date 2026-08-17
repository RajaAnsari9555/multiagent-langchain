from langchain.agents import create_agent
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tools import web_search , scrape_webpage

import os
import time
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model setup — Groq (blazing fast inference, generous free tier)
# Primary  : openai/gpt-oss-20b       (free, fast, good quality)
# Fallback : llama-3.1-8b-instant     (ultra-fast backup)
# ---------------------------------------------------------------------------
PRIMARY_MODEL  = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
FALLBACK_MODEL = "llama-3.1-8b-instant"

def _make_llm(model_name: str) -> ChatGroq:
    return ChatGroq(
        model=model_name,
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY")
    )

def _llm_with_fallback(prompt, **kwargs):
    """
    Invoke a chain built on the primary model.
    On 429 rate limit:
      1. Retry up to 3× with exponential back-off on the same model.
      2. If still failing, switch to the fallback model and try once more.
    Returns the string result.
    """
    for model_name in (PRIMARY_MODEL, FALLBACK_MODEL):
        llm_instance = _make_llm(model_name)
        chain = prompt | llm_instance | StrOutputParser()
        for attempt in range(1, 4):          # up to 3 retries per model
            try:
                return chain.invoke(kwargs)
            except Exception as exc:
                msg = str(exc).lower()
                if "429" in msg or "rate" in msg or "quota" in msg:
                    wait = attempt * 10      # 10s, 20s, 30s
                    logger.warning(
                        "Rate-limited on %s (attempt %d/3). "
                        "Retrying in %ds…", model_name, attempt, wait
                    )
                    time.sleep(wait)
                else:
                    raise                    # non-quota error → re-raise immediately
        logger.warning("Exhausted retries on %s, switching model…", model_name)

    raise RuntimeError("Both models are rate-limited. Please wait and try again.")


llm = _make_llm(PRIMARY_MODEL)

# Retry-aware chain wrapper — used by writer and critic
class _RetryChain:
    def __init__(self, prompt):
        self._prompt = prompt
    def invoke(self, kwargs):
        return _llm_with_fallback(self._prompt, **kwargs)

#1st agent

def build_search_agent():
    return create_agent(
        model = llm,
        tools=[web_search]
    )
def build_reader_agent():
    return create_agent(
        model = llm,
        tools = [scrape_webpage]
    )

#writer chain

writer_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert research writer. Write clear, structured and insightful reports."),
    ("human", """Write a detailed research report on the topic below.

Topic: {topic}

Research Gathered:
{research}

Structure the report as:
- Introduction
- Key Findings (minimum 3 well-explained points)
- Conclusion
- Sources (list all URLs found in the research)

Be detailed, factual and professional."""),

]
)
writer_chain  = _RetryChain(writer_prompt)

#critic chain

critic_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a sharp and constructive research critic. Be honest and specific."),
    ("human", """Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
..."""),

]) 

critics_chain = _RetryChain(critic_prompt)




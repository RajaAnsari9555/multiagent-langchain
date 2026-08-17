from langchain.tools import tool
import os
import re

import requests
from bs4 import BeautifulSoup
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()


tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

@tool
def web_search(query : str) -> str:
    """Search the web and return titles, URLs, and short snippets."""
    results = tavily.search(query =query ,max_results=5)

    out = []

    for r in results['results']:
     out.append(
        f"Title:{r['title']}\nURL:{r['url']}\nSnipeet: {r['content'][:300]}\n"
     )

    return "\n-----\n".join(out)

@tool
def scrape_webpage(url: str) -> str:
    """Scrape a URL and return only its clean text content."""
    try:
        response = requests.get(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (compatible; DeepReadingBot/1.0; "
                    "+https://example.com/bot)"
                )
            },
            timeout=8,
        )
        response.raise_for_status()
    except requests.exceptions.MissingSchema:
        return "Error: Please provide a complete URL, for example https://example.com."
    except requests.exceptions.Timeout:
        return "Error: The website took too long to respond. Please try again later."
    except requests.exceptions.ConnectionError:
        return "Error: Unable to connect to the website. Check the URL or your network connection."
    except requests.exceptions.HTTPError as error:
        return f"Error: The website returned HTTP {error.response.status_code}."
    except requests.exceptions.RequestException as error:
        return f"Error: Unable to fetch the page ({error})."

    try:
        soup = BeautifulSoup(response.content, "lxml")

        for element in soup(["script", "style", "nav", "footer"]):
            element.decompose()

        clean_text = soup.get_text(separator="\n", strip=True)[:3000]
        clean_text = re.sub(r"\n{3,}", "\n\n", clean_text)
        if not clean_text:
            return "Error: No readable text content was found on this page."

        return clean_text
    except Exception as error:
        return f"Error: The page was fetched but could not be parsed ({error})."
# print(scrape_webpage.invoke("https://www.womenshealthmag.com/sex-and-love/a19997457/11-positions-for-crazy-deep-sex/"))
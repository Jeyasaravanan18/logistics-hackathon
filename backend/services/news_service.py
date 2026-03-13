"""
News Service — fetches logistics disruption news from GNews API.
Falls back to curated mock data when API key is missing or rate-limited.
"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GNEWS_API_KEY = os.getenv("GNEWS_API_KEY", "")

SEARCH_QUERIES = [
    "highway closure India",
    "flood road block India",
    "expressway accident India",
    "port congestion India",
]




def _parse_article_to_disruption(article: dict, idx: int) -> dict | None:
    """Convert GNews article to a disruption dict using keyword matching."""
    LOCATION_KEYWORDS = {
        "Chennai": (13.0827, 80.2707),
        "Mumbai": (19.0760, 72.8777),
        "Delhi": (28.6139, 77.2090),
        "Bangalore": (12.9716, 77.5946),
        "Kolkata": (22.5726, 88.3639),
        "Hyderabad": (17.3850, 78.4867),
        "Pune": (18.5204, 73.8567),
        "Nagpur": (21.1458, 79.0882),
        "Kochi": (9.9312, 76.2673),
        "Patna": (25.5941, 85.1376),
    }

    SEVERITY_KEYWORDS = {
        "HIGH": ["flood", "closure", "blocked", "accident", "cyclone", "severe", "emergency"],
        "MEDIUM": ["delay", "congestion", "slow", "disruption", "affected", "agitation"],
        "LOW": ["minor", "light", "possible", "expected"],
    }

    title = article.get("title", "")
    description = article.get("description", "")
    content = f"{title} {description}".lower()

    detected_location = None
    lat, lon = 20.5937, 78.9629  # India centroid as fallback
    for city, coords in LOCATION_KEYWORDS.items():
        if city.lower() in content:
            detected_location = city
            lat, lon = coords
            break

    # Base severity default — let LangChain AI determine actual severity
    severity = "MEDIUM"
    for level, keywords in SEVERITY_KEYWORDS.items():
        if any(kw in content for kw in keywords):
            severity = level
            break

    return {
        "id": f"N{100 + idx}",
        "type": "news",
        "subtype": "Logistics Disruption",
        "location": detected_location or "India",
        "lat": lat,
        "lon": lon,
        "severity": severity,
        "description": f"{title[:200]}",
        "source": article.get("source", {}).get("name", "News"),
        "url": article.get("url", ""),
        "timestamp": article.get("publishedAt", "2026-03-12T13:00:00"),
    }


async def fetch_news_disruptions() -> list[dict]:
    """Fetch logistics disruption news from GNews."""
    if not GNEWS_API_KEY or GNEWS_API_KEY == "your_gnews_api_key_here":
        raise ValueError("Missing GNews API Key. Synthetic data is disabled for production.")

    disruptions = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        for query in SEARCH_QUERIES[:2]:  # Limit to 2 queries on free tier
            try:
                resp = await client.get(
                    "https://gnews.io/api/v4/search",
                    params={
                        "q": query,
                        "lang": "en",
                        "country": "in",
                        "max": 5,
                        "apikey": GNEWS_API_KEY,
                    },
                )
                if resp.status_code == 200:
                    articles = resp.json().get("articles", [])
                    for idx, article in enumerate(articles):
                        d = _parse_article_to_disruption(article, len(disruptions) + idx)
                        if d:
                            disruptions.append(d)
            except Exception as e:
                print(f"[NewsService] Error fetching news for '{query}': {e}")

    return disruptions

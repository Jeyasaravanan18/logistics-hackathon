"""
Agent 1: Data Collector Agent
Responsibility: Fetches and unifies disruption signals from weather and news APIs.
"""

from services.weather_service import fetch_weather_disruptions
from services.news_service import fetch_news_disruptions


async def collect_disruptions() -> dict:
    """
    Collects disruption data from all sources and returns a unified list.
    Agent reasoning: Aggregates multiple signal types to ensure comprehensive coverage.
    """
    print("[DataCollectorAgent] Starting disruption signal collection...")

    weather_disruptions = []
    news_disruptions = []

    try:
        weather_disruptions = await fetch_weather_disruptions()
    except Exception as e:
        print(f"[DataCollectorAgent] Weather fetch error: {e}")
    
    try:
        news_disruptions = await fetch_news_disruptions()
    except Exception as e:
        print(f"[DataCollectorAgent] News fetch error: {e}")

    all_disruptions = weather_disruptions + news_disruptions

    # Deduplicate by location + type to avoid double-counting
    seen = set()
    unique_disruptions = []
    for d in all_disruptions:
        key = (d.get("location", ""), d.get("subtype", ""))
        if key not in seen:
            seen.add(key)
            unique_disruptions.append(d)

    result = {
        "total": len(unique_disruptions),
        "weather_count": len(weather_disruptions),
        "news_count": len(news_disruptions),
        "disruptions": unique_disruptions,
        "agent": "DataCollectorAgent",
        "reasoning": (
            f"Collected {len(weather_disruptions)} weather signals and "
            f"{len(news_disruptions)} news signals. After deduplication, "
            f"{len(unique_disruptions)} unique disruption events identified."
        ),
    }

    print(f"[DataCollectorAgent] Done. {len(unique_disruptions)} disruptions collected.")
    return result

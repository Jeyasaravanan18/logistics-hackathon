"""GET /risk-analysis — returns risk analysis results from Redis cache, or runs synchronously as fallback."""
from fastapi import APIRouter
import redis
import json
import os
import asyncio
from agents.data_collector import collect_disruptions
from agents.disruption_analyzer import analyze_disruptions
from agents.risk_evaluator import evaluate_shipment_risks
from agents.recommendation import generate_recommendations

router = APIRouter()
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


async def _run_pipeline_sync() -> dict:
    """Run the full 4-agent pipeline synchronously as a fallback."""
    collected = await collect_disruptions()
    analyzed = await analyze_disruptions(collected["disruptions"])
    risk_records = evaluate_shipment_risks(analyzed)
    recommendations = await generate_recommendations(risk_records)

    risk_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0, "SAFE": 0}
    for r in recommendations:
        level = r.get("risk_level", "SAFE")
        risk_counts[level] = risk_counts.get(level, 0) + 1

    return {
        "pipeline": {
            "disruptions_collected": len(analyzed),
            "shipments_evaluated": len(recommendations),
            "risk_breakdown": risk_counts,
            "collector_reasoning": collected.get("reasoning", ""),
        },
        "recommendations": recommendations,
    }


@router.get("/risk-analysis")
async def get_risk_analysis():
    # 1. Try to get cached result from Redis first
    try:
        redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=1)
        cached_result = redis_client.get("latest_risk_analysis")
        if cached_result:
            return json.loads(cached_result)
    except Exception:
        pass  # Redis not available — fall through to synchronous execution

    # 2. Synchronous fallback: run all 4 agents directly
    result = await _run_pipeline_sync()
    return result

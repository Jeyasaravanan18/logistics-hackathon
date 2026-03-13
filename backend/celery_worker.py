import asyncio
import json
import os
from celery import Celery
import redis
from agents.data_collector import collect_disruptions
from agents.disruption_analyzer import analyze_disruptions
from agents.risk_evaluator import evaluate_shipment_risks
from agents.recommendation import generate_recommendations

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Initialize Celery app
celery_app = Celery("logistics_tasks", broker=REDIS_URL, backend=REDIS_URL)

# Configure periodic task
celery_app.conf.beat_schedule = {
    'run-ai-pipeline-every-15-mins': {
        'task': 'celery_worker.run_risk_analysis_pipeline',
        'schedule': 900.0, # 15 minutes
    },
}

# Redis client for caching
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)


async def _run_async_pipeline():
    """Runs the 4 agents asynchronously and saves the JSON to Redis."""
    print("[CeleryTask] Starting background AI Pipeline...")
    
    # 1. Collect
    collected = await collect_disruptions()

    # 2. Analyze
    analyzed_disruptions = await analyze_disruptions(collected["disruptions"])

    # 3. Evaluate risk
    risk_records = evaluate_shipment_risks(analyzed_disruptions)

    # 4. Recommend
    recommendations = await generate_recommendations(risk_records)

    risk_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0, "SAFE": 0}
    for r in recommendations:
        level = r.get("risk_level", "SAFE")
        risk_counts[level] = risk_counts.get(level, 0) + 1

    final_payload = {
        "pipeline": {
            "disruptions_collected": len(analyzed_disruptions),
            "shipments_evaluated": len(recommendations),
            "risk_breakdown": risk_counts,
            "collector_reasoning": collected["reasoning"],
        },
        "recommendations": recommendations,
    }

    # Cache in Redis with expiration
    redis_client.setex("latest_risk_analysis", 3600, json.dumps(final_payload))
    print("[CeleryTask] Finished. Cached results in Redis.")
    
    # Publish to a redis pub/sub channel for WebSockets
    redis_client.publish("risk_updates", json.dumps({"status": "updated"}))

@celery_app.task
def run_risk_analysis_pipeline():
    """Celery task entrypoint."""
    asyncio.run(_run_async_pipeline())
    return "Pipeline Complete"

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base, AsyncSessionLocal
import crud
import os
import json
import redis.asyncio as aioredis
from routers import shipments, disruptions, risk_analysis

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed data
    async with AsyncSessionLocal() as session:
        await crud.init_mock_data(session)
        
    yield

app = FastAPI(
    title="Logistics Disruption Intelligence Agent API",
    description="Production Architecture with Postgres & Redis",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shipments.router, tags=["Shipments"])
app.include_router(disruptions.router, tags=["Disruptions"])
app.include_router(risk_analysis.router, tags=["Risk Analysis"])

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

@app.websocket("/ws/risk-updates")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    redis_client = None
    pubsub = None
    
    try:
        redis_client = await aioredis.from_url(REDIS_URL, decode_responses=True)
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("risk_updates")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await websocket.send_json({"event": "analysis_complete", "data": data})
                
    except Exception as e:
        print(f"[WebSocket] Falling back to polling mode (Redis not available): {e}")
        # Keep connection alive without Redis so frontend doesn't throw errors
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
            
    finally:
        if pubsub:
            await pubsub.unsubscribe("risk_updates")
        if redis_client:
            await redis_client.close()


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "message": "Logistics Disruption Intelligence Agent API",
        "endpoints": ["/shipments", "/disruptions", "/risk-analysis", "/docs"],
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}

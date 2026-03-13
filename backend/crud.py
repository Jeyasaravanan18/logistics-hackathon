from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import models
import schemas

async def get_shipments(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(models.Shipment).offset(skip).limit(limit))
    return result.scalars().all()

async def get_shipment_by_id(db: AsyncSession, shipment_id: str):
    result = await db.execute(select(models.Shipment).where(models.Shipment.shipment_id == shipment_id))
    return result.scalars().first()

async def init_mock_data(db: AsyncSession):
    """Seed the DB with the Indian shipment routes if empty."""
    existing = await get_shipments(db, limit=1)
    if existing:
        return

    import json
    import os
    from datetime import datetime
    
    # Load from the old JSON file to seed DB
    json_path = os.path.join(os.path.dirname(__file__), "data", "shipments.json")
    if not os.path.exists(json_path):
        return

    with open(json_path, 'r') as f:
        data = json.load(f)

    for item in data:
        # Convert string timestamp to datetime
        if item.get("estimated_delivery_time"):
            item["estimated_delivery_time"] = datetime.fromisoformat(item["estimated_delivery_time"])
        
        db_shipment = models.Shipment(**item)
        db.add(db_shipment)
    
    await db.commit()
    print("[CRUD] Initialized database with mock shipment routes.")

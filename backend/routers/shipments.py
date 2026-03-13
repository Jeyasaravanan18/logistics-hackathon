"""GET /shipments — returns the shipment dataset from PostgreSQL."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
import crud
import schemas

router = APIRouter()

@router.get("/shipments", response_model=schemas.ShipmentListResponse)
async def get_shipments_api(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    shipments = await crud.get_shipments(db, skip=skip, limit=limit)
    return {
        "count": len(shipments),
        "shipments": shipments,
    }

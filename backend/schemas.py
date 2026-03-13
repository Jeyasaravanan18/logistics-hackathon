from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ShipmentBase(BaseModel):
    origin: str
    destination: str
    route_highway: str
    latitude: float
    longitude: float
    delivery_priority: str
    estimated_delivery_time: Optional[datetime] = None
    cargo_type: Optional[str] = None
    weight_kg: Optional[int] = None

class ShipmentCreate(ShipmentBase):
    shipment_id: str

class ShipmentOut(ShipmentBase):
    shipment_id: str

    class Config:
        from_attributes = True

# Response schema for the API
class ShipmentListResponse(BaseModel):
    count: int
    shipments: list[ShipmentOut]

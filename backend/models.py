from sqlalchemy import Column, String, Float, DateTime, Integer
from database import Base

class Shipment(Base):
    __tablename__ = "shipments"

    shipment_id = Column(String, primary_key=True, index=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    route_highway = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    delivery_priority = Column(String, nullable=False) # HIGH, MEDIUM, LOW
    estimated_delivery_time = Column(DateTime, nullable=True)
    cargo_type = Column(String, nullable=True)
    weight_kg = Column(Integer, nullable=True)

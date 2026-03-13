"""
Geospatial Matcher — uses Haversine formula to match disruptions to shipment routes.
"""

import math


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points in kilometers."""
    R = 6371  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def match_disruptions_to_shipments(
    disruptions: list[dict],
    shipments: list[dict],
    radius_km: float = 100.0,
) -> list[dict]:
    """
    Match each disruption to shipments within radius_km.
    Returns a list of match records with distance and both entities.
    """
    matches = []
    for disruption in disruptions:
        d_lat = disruption.get("lat")
        d_lon = disruption.get("lon")
        if d_lat is None or d_lon is None:
            continue

        for shipment in shipments:
            s_lat = shipment.get("latitude")
            s_lon = shipment.get("longitude")
            if s_lat is None or s_lon is None:
                continue

            distance = haversine_km(d_lat, d_lon, s_lat, s_lon)
            if distance <= radius_km:
                matches.append(
                    {
                        "shipment": shipment,
                        "disruption": disruption,
                        "distance_km": round(distance, 1),
                    }
                )

    return matches


def compute_risk_score(
    disruption_severity: str,
    delivery_priority: str,
    distance_km: float,
    radius_km: float = 100.0,
) -> tuple[str, float]:
    """
    Compute numeric risk score and label based on:
    - disruption severity (HIGH=3, MEDIUM=2, LOW=1)
    - delivery priority (HIGH=3, MEDIUM=2, LOW=1)
    - proximity (closer = higher risk, linear scale)
    Returns (risk_level, score).
    """
    severity_weight = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}.get(disruption_severity, 1)
    priority_weight = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}.get(delivery_priority, 1)
    proximity_factor = 1.0 - (distance_km / radius_km)  # 1.0 at centre, 0.0 at edge

    score = severity_weight * priority_weight * proximity_factor

    if score >= 5:
        risk_level = "HIGH"
    elif score >= 2:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return risk_level, round(score, 2)

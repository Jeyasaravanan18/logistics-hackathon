"""
Agent 4: Recommendation Agent
Responsibility: Generates actionable recommendations for each at-risk shipment.

UPGRADED: Now uses LangChain LCEL pipeline with ChatGoogleGenerativeAI + JsonOutputParser.
Uses a tailor prompt with full shipment and disruption context. Falls back to rule templates.
"""

import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Rule-based recommendation templates per (risk_level, disruption_type)
RULE_TEMPLATES = {
    ("HIGH", "Heavy Rain"): (
        "Halt shipment and wait for weather clearance. "
        "Reroute via nearest alternative highway. "
        "Notify customer of 6-12 hour delay."
    ),
    ("HIGH", "Thunderstorm"): (
        "Suspend convoy movement immediately. Seek covered shelter at nearest truck bay. "
        "Inform customer of weather-induced delay. Resume only after storm advisory is lifted."
    ),
    ("HIGH", "Highway Closure"): (
        "Reroute via alternate highway immediately. "
        "Coordinate with fleet manager for updated ETAs. "
        "Notify customer with revised delivery window."
    ),
    ("HIGH", "Flooding"): (
        "Do NOT attempt flooded routes. Hold shipment at nearest secure facility. "
        "Activate emergency rerouting protocol. Notify customer with HIGH-priority delay alert."
    ),
    ("HIGH", "Cyclonic Rain"): (
        "Activate emergency reroute immediately. Do not operate vehicles in high-wind zones. "
        "Issue customer delay notification with cyclone advisory reference."
    ),
    ("HIGH", "Port Congestion"): (
        "Switch to road/rail alternative mode where possible. "
        "Escalate to senior logistics manager. Notify customer of 48-hour port delay."
    ),
    ("MEDIUM", "Dense Fog"): (
        "Reduce convoy speed and increase following distance. Enable additional lighting. "
        "Monitor visibility conditions every hour. Notify customer of possible 2-4 hour delay."
    ),
    ("MEDIUM", "Road Block"): (
        "Contact local transport authority for diversion details. "
        "Identify and pre-clear alternate route. Update customer ETA with 3-5 hour buffer."
    ),
    ("MEDIUM", "Port Congestion"): (
        "Monitor port status updates hourly. Explore pre-lodgment of documentation. "
        "Notify customer of possible 24-hour delay."
    ),
}

DEFAULT_TEMPLATES = {
    "HIGH": (
        "Immediate action required: Halt shipment and activate emergency reroute protocol. "
        "Notify customer immediately with revised ETA. Escalate to senior logistics manager."
    ),
    "MEDIUM": (
        "Monitor situation closely. Prepare alternate route options. "
        "Notify customer proactively with possible delay warning."
    ),
    "LOW": "Continue with caution. Monitor route conditions. No immediate customer notification required.",
    "SAFE": "No action required. Shipment is on track for on-time delivery.",
}

HIGHWAY_ALTERNATES = {
    "NH44": "NH75 or NH48", "NH48": "NH19 or NH27", "NH16": "NH16B or coastal route",
    "NH27": "NH30 or rail", "NH65": "NH765 or NH163", "NH544": "NH66 coastal route",
    "NH62": "SH25 via Barmer", "NH60": "NH61 or NH753A", "NH46": "NH347 or SH21",
    "NH19": "NH31 or rail",
}
DELAY_MAP = {"HIGH": 8, "MEDIUM": 3, "LOW": 1, "SAFE": 0}


def _rule_based_recommendation(risk_record: dict) -> dict:
    """Generate recommendation from rule templates (fallback)."""
    risk_level = risk_record.get("risk_level", "SAFE")
    disruption_type = risk_record.get("disruption_type", "")
    action = RULE_TEMPLATES.get(
        (risk_level, disruption_type), DEFAULT_TEMPLATES.get(risk_level, "Monitor shipment.")
    )
    delay = DELAY_MAP.get(risk_level, 0)
    return {
        **risk_record,
        "suggested_action": action,
        "alternate_route": HIGHWAY_ALTERNATES.get(risk_record.get("route_highway", ""), "Contact regional coordinator"),
        "estimated_delay_hours": delay,
        "customer_message": (
            f"Your shipment {risk_record.get('shipment_id')} from {risk_record.get('origin')} to "
            f"{risk_record.get('destination')} may experience a delay of ~{delay} hours "
            f"due to {risk_record.get('disruption_type', 'route disruption')} near "
            f"{risk_record.get('disruption_location', 'your route')}. We are monitoring the situation."
            if risk_level != "SAFE"
            else f"Your shipment {risk_record.get('shipment_id')} is on track for on-time delivery."
        ),
        "recommendation_by": "rule-based",
    }


def _build_langchain_recommendation_chain():
    """
    Build the LangChain LCEL chain for generating actionable recommendations.
    Uses ChatPromptTemplate | ChatGoogleGenerativeAI | JsonOutputParser
    """
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import JsonOutputParser

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash-latest",
        google_api_key=GEMINI_API_KEY,
        temperature=0.2,
    )

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are a senior logistics operations manager AI for Indian freight. "
            "Generate specific, actionable route recommendations for shipments at risk. "
            "Respond ONLY with valid JSON — no text before or after."
        ),
        (
            "human",
            """A shipment requires an operational decision based on the current disruption.

SHIPMENT:
- ID: {shipment_id}
- Route: {origin} → {destination} via {route_highway}
- Cargo: {cargo_type} ({delivery_priority} priority)
- ETA: {estimated_delivery_time}

RISK ASSESSMENT:
- Risk Level: {risk_level}
- Disruption Type: {disruption_type}
- Disruption Location: {disruption_location}
- Distance from Route: {distance_to_disruption_km} km
- Reason: {reason}

Generate a specific, expert recommendation as JSON:
{{
  "suggested_action": "<specific 2-4 sentence action steps for the driver and operations team>",
  "alternate_route": "<specific alternate highway or transport mode, or 'No reroute needed'>",
  "estimated_delay_hours": <integer 0-72>,
  "customer_message": "<professional 1-2 sentence customer-facing notification>"
}}"""
        ),
    ])

    parser = JsonOutputParser()
    chain = prompt | llm | parser
    return chain


async def _langchain_recommendation(risk_record: dict) -> dict:
    """Use LangChain LCEL chain to generate context-aware recommendations."""
    try:
        chain = _build_langchain_recommendation_chain()
        result = await chain.ainvoke({
            "shipment_id": risk_record.get("shipment_id", "UNKNOWN"),
            "origin": risk_record.get("origin", "Unknown"),
            "destination": risk_record.get("destination", "Unknown"),
            "route_highway": risk_record.get("route_highway", "Unknown"),
            "cargo_type": risk_record.get("cargo_type", "General"),
            "delivery_priority": risk_record.get("delivery_priority", "MEDIUM"),
            "estimated_delivery_time": risk_record.get("estimated_delivery_time", "Unknown"),
            "risk_level": risk_record.get("risk_level", "LOW"),
            "disruption_type": risk_record.get("disruption_type", "Unknown"),
            "disruption_location": risk_record.get("disruption_location", "Unknown"),
            "distance_to_disruption_km": risk_record.get("distance_to_disruption_km", "Unknown"),
            "reason": risk_record.get("reason", "Disruption detected near route."),
        })
        print(f"[RecommendationAgent][LangChain] Generated for: {risk_record.get('shipment_id')} ({risk_record.get('risk_level')})")
        return {**risk_record, **result, "recommendation_by": "langchain-gemini-1.5-flash"}
    except Exception as e:
        print(f"[RecommendationAgent] LangChain failed ({e}), using rule-based fallback")
        return _rule_based_recommendation(risk_record)


async def generate_recommendations(risk_records: list[dict]) -> list[dict]:
    """
    Agent 4 main function: Generate recommendations for all risk records.
    Uses LangChain LCEL pipeline for non-SAFE shipments.
    SAFE shipments receive a rule-based confirmation.
    """
    print(f"[RecommendationAgent] Generating recommendations for {len(risk_records)} shipments via LangChain...")

    use_langchain = bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here")
    recommendations = []

    for record in risk_records:
        if record.get("risk_level") == "SAFE":
            recommendations.append(_rule_based_recommendation(record))
        elif use_langchain:
            rec = await _langchain_recommendation(record)
            recommendations.append(rec)
        else:
            recommendations.append(_rule_based_recommendation(record))

    print(f"[RecommendationAgent] Done. {len(recommendations)} recommendations generated.")
    return recommendations

"""
Agent 2: Disruption Analysis Agent
Responsibility: Interprets each disruption, enriches severity, and extracts key attributes.

UPGRADED: Now uses LangChain LCEL pipeline with ChatGoogleGenerativeAI + JsonOutputParser
for structured, reliable AI reasoning with automatic fallback.
"""

import os
import json
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Impact duration estimates per disruption subtype (hours)
IMPACT_DURATION_MAP = {
    "Heavy Rain": 6, "Thunderstorm": 4, "Dense Fog": 3,
    "Cyclonic Rain": 12, "Highway Closure": 8, "Flooding": 24,
    "Port Congestion": 48, "Road Block": 5, "Accident": 4,
    "Snow": 12, "Dust Storm": 3,
}

TRANSPORT_IMPACT_MAP = {
    "Heavy Rain": ["road", "rail"], "Thunderstorm": ["road", "air"],
    "Dense Fog": ["road", "air"], "Cyclonic Rain": ["road", "rail", "sea"],
    "Highway Closure": ["road"], "Flooding": ["road", "rail"],
    "Port Congestion": ["sea", "road"], "Road Block": ["road"],
}


def _rule_based_analysis(disruption: dict) -> dict:
    """Enrich disruption with rule-based impact estimates (fallback)."""
    subtype = disruption.get("subtype", "")
    severity = disruption.get("severity", "LOW")
    location = disruption.get("location", "Unknown")
    impact_duration = IMPACT_DURATION_MAP.get(subtype, 4)
    affected_transport = TRANSPORT_IMPACT_MAP.get(subtype, ["road"])
    severity_text = {
        "HIGH": "severe operational disruptions expected",
        "MEDIUM": "moderate delays and rerouting possible",
        "LOW": "minor impact, monitoring recommended",
    }.get(severity, "impact unknown")
    reasoning = (
        f"Disruption type '{subtype}' at {location} classified as {severity} severity. "
        f"Expected to impact {', '.join(affected_transport)} transport modes for ~{impact_duration}h. "
        f"Analysis: {severity_text}."
    )
    return {
        **disruption,
        "impact_duration_hours": impact_duration,
        "affected_transport_modes": affected_transport,
        "analysis_reasoning": reasoning,
        "analyzed_by": "rule-based",
    }


def _build_langchain_chain():
    """
    Build the LangChain LCEL chain for disruption analysis.
    Uses ChatPromptTemplate | ChatGoogleGenerativeAI | JsonOutputParser
    """
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import JsonOutputParser

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash-latest",
        google_api_key=GEMINI_API_KEY,
        temperature=0.1,
    )

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are an expert logistics disruption analyst for Indian highway freight. "
            "Analyze disruptions and respond ONLY with valid JSON. "
            "Your response must be a single valid JSON object."
        ),
        (
            "human",
            """Analyze this logistics disruption:
- Type: {subtype}
- Location: {location}
- Severity: {severity}
- Description: {description}

Respond ONLY with this exact JSON structure:
{{
  "impact_duration_hours": <integer between 1-72>,
  "affected_transport_modes": ["road", "rail", "air", "sea"],
  "risk_factors": ["specific risk factor 1", "specific risk factor 2"],
  "analysis_reasoning": "<2-3 sentence expert analysis specific to the disruption>"
}}"""
        ),
    ])

    parser = JsonOutputParser()
    chain = prompt | llm | parser
    return chain


async def _langchain_analysis(disruption: dict) -> dict:
    """Use LangChain LCEL chain to enrich disruption analysis."""
    try:
        chain = _build_langchain_chain()
        result = await chain.ainvoke({
            "subtype": disruption.get("subtype", "Unknown"),
            "location": disruption.get("location", "Unknown"),
            "severity": disruption.get("severity", "LOW"),
            "description": disruption.get("description", "No details provided"),
        })
        print(f"[DisruptionAnalyzerAgent][LangChain] Analyzed: {disruption.get('subtype')} at {disruption.get('location')}")
        return {**disruption, **result, "analyzed_by": "langchain-gemini-1.5-flash"}
    except Exception as e:
        print(f"[DisruptionAnalyzerAgent] LangChain failed ({e}), using rule-based fallback")
        return _rule_based_analysis(disruption)


async def analyze_disruptions(disruptions: list[dict]) -> list[dict]:
    """
    Agent 2 main function: Analyze and enrich each disruption.
    Uses LangChain LCEL pipeline (ChatGoogleGenerativeAI + JsonOutputParser).
    Falls back to rule-based logic if LangChain/API unavailable.
    """
    print(f"[DisruptionAnalyzerAgent] Analyzing {len(disruptions)} disruptions via LangChain...")

    use_langchain = bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here")

    analyzed = []
    for d in disruptions:
        if use_langchain:
            enriched = await _langchain_analysis(d)
        else:
            enriched = _rule_based_analysis(d)
        analyzed.append(enriched)

    print(f"[DisruptionAnalyzerAgent] Done. Analyzed {len(analyzed)} disruptions.")
    return analyzed

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function fetchShipments() {
  const res = await fetch(`${BACKEND}/shipments`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch shipments");
  return res.json();
}

export async function fetchDisruptions() {
  const res = await fetch(`${BACKEND}/disruptions`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch disruptions");
  return res.json();
}

export async function fetchRiskAnalysis() {
  const res = await fetch(`${BACKEND}/risk-analysis`, { cache: "no-store" });
  if (res.status === 503) {
    // Pipeline is running — return null so dashboard shows a loading state
    return null;
  }
  if (!res.ok) throw new Error("Failed to fetch risk analysis");
  return res.json();
}

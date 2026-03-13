"use client";
import { useState, useEffect, useCallback } from "react";
import { fetchShipments, fetchDisruptions, fetchRiskAnalysis } from "@/lib/api";
import type { Shipment, Disruption, Recommendation, RiskAnalysis } from "@/types";
import KpiCard from "@/components/KpiCard";
import Sidebar from "@/components/Sidebar";
import RiskTable from "@/components/RiskTable";
import DisruptionList from "@/components/DisruptionList";
import RecommendationCards from "@/components/RecommendationCards";
import MapView from "@/components/MapView";
import AgentTrace from "@/components/AgentTrace";

const BACKEND_WS = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000")
  .replace("http://", "ws://")
  .replace("https://", "wss://");

const TABS = ["MAP_VIEW", "SHIPMENTS", "DISRUPTIONS", "RISK_ANALYSIS", "AI_CORE"] as const;
const TAB_ICONS = ["🗺️", "📦", "⚡", "🎯", "🤖"] as const;

export default function DashboardPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [riskData, setRiskData] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveUpdate, setLiveUpdate] = useState(false);
  const [tab, setTab] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sh, dis, risk] = await Promise.all([
        fetchShipments().catch(() => ({ shipments: [] })),
        fetchDisruptions().catch(() => ({ disruptions: [] })),
        fetchRiskAnalysis().catch(() => null),
      ]);
      setShipments(sh?.shipments || []);
      setDisruptions(dis?.disruptions || []);
      setRiskData(risk);
      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadAll(); }, [loadAll]);

  // WebSocket for live push updates
  useEffect(() => {
    const ws = new WebSocket(`${BACKEND_WS}/ws/risk-updates`);
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.event === "analysis_complete") {
        setLiveUpdate(true);
        setTimeout(() => setLiveUpdate(false), 4000);
        loadAll();
      }
    };
    ws.onerror = () => {}; // Silently fail if no WS
    return () => ws.close();
  }, [loadAll]);

  const recs = riskData?.recommendations ?? [];
  const pipeline = riskData?.pipeline;
  const rb = pipeline?.risk_breakdown ?? { HIGH: 0, MEDIUM: 0, LOW: 0, SAFE: 0 };

  return (
    <div className="flex min-h-screen">
      <Sidebar onRefresh={loadAll} loading={loading} lastUpdated={lastUpdated} />

      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end border-b border-cyber-border pb-4 relative">
          <div>
            <div className="text-[10px] text-cyber-cyan font-mono tracking-[0.3em] mb-2 uppercase">System Overview</div>
            <h1 className="text-4xl font-extrabold uppercase tracking-tight text-cyber-text" style={{ textShadow: "0 0 10px rgba(224,242,255,0.3)" }}>
              Global Routing <span className="text-cyber-cyan">Matrix</span>
            </h1>
          </div>
          {liveUpdate && (
            <div className="absolute right-0 top-0 px-4 py-1 bg-cyber-pink/20 border border-cyber-pink text-cyber-pink font-mono text-xs uppercase animate-pulse shadow-neon-pink">
              Incoming Transmission...
            </div>
          )}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <KpiCard label="Active Targets" value={shipments.length} color="var(--cyber-cyan)" />
          <KpiCard label="Anomalies" value={disruptions.length} color="var(--cyber-purple)" />
          <KpiCard label="Critical Risk" value={rb.HIGH} color="var(--cyber-pink)" />
          <KpiCard label="Warning Level" value={rb.MEDIUM} color="var(--cyber-yellow)" />
          <KpiCard label="Clear Routes" value={rb.SAFE} color="var(--cyber-green)" />
        </div>

        {/* Cyber Tabs */}
        <div className="flex gap-4 mb-8 border-b-[2px] border-cyber-border/50 pb-[2px] relative z-20">
          {TABS.map((t, i) => {
            const isActive = tab === i;
            return (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`group relative px-6 py-3 text-sm font-display tracking-widest uppercase transition-all duration-300 ${
                  isActive 
                    ? "text-black bg-cyber-cyan shadow-[0_0_15px_rgba(0,240,255,0.6)]" 
                    : "text-cyber-cyan bg-black/40 hover:bg-cyber-cyan/20 border border-cyber-cyan/30 hover:border-cyber-cyan"
                }`}
                style={{ 
                  clipPath: "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)" 
                }}
              >
                {/* Tech corner accent for inactive tabs */}
                {!isActive && (
                  <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyber-cyan opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                )}
                
                <span className={`mr-2 ${isActive ? 'opacity-80' : 'opacity-50'}`}>{TAB_ICONS[i]}</span> 
                {t.replace("_", " ")}
                
                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white opacity-50"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Wrapper */}
        <div className="cyber-panel p-6 min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-16 h-16 border-4 border-cyber-border border-t-cyber-cyan rounded-full animate-spin shadow-neon-cyan"></div>
              <div className="text-cyber-cyan font-mono text-sm tracking-widest uppercase animate-pulse">Running Neural Pipeline...</div>
            </div>
          ) : (
            <>
              {tab === 0 && <MapView shipments={shipments} disruptions={disruptions} recommendations={recs} />}
              {tab === 1 && <ShipmentsTab shipments={shipments} recommendations={recs} />}
              {tab === 2 && <DisruptionList disruptions={disruptions} collectorReasoning={pipeline?.collector_reasoning} />}
              {tab === 3 && <RiskTable recommendations={recs} riskBreakdown={rb} />}
              {tab === 4 && <RecommendationCards recommendations={recs} pipeline={pipeline} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Inline Shipments Tab ──────────────────────────────────────────────────────
function ShipmentsTab({ shipments, recommendations }: { shipments: Shipment[]; recommendations: Recommendation[] }) {
  const riskLookup = Object.fromEntries(recommendations.map((r) => [r.shipment_id, r.risk_level]));
  const [prioFilter, setPrioFilter] = useState<string[]>(["HIGH", "MEDIUM", "LOW"]);
  const [riskFilter, setRiskFilter] = useState<string[]>(["HIGH", "MEDIUM", "LOW", "SAFE"]);

  const toggleFilter = (val: string, arr: string[], set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const getRiskColor = (rl: string) => {
    return { HIGH: "var(--cyber-pink)", MEDIUM: "var(--cyber-yellow)", LOW: "var(--cyber-green)", SAFE: "var(--cyber-cyan)" }[rl] || "var(--cyber-cyan)";
  };

  const filtered = shipments.filter(
    (s) => prioFilter.includes(s.delivery_priority) && riskFilter.includes(riskLookup[s.shipment_id] ?? "SAFE")
  );

  return (
    <div>
      <div className="flex justify-between items-end mb-6 border-b border-cyber-border pb-4">
        <h2 className="text-xl font-bold text-cyber-text uppercase tracking-widest font-mono">
          <span className="text-cyber-purple mr-2">::</span> Active Fleet Matrix
        </h2>
      </div>
      
      <div className="flex gap-8 mb-8 flex-wrap">
        <div>
          <p className="text-[10px] mb-3 text-cyber-muted font-mono tracking-widest uppercase">Filter / Priority</p>
          <div className="flex gap-3">
            {["HIGH", "MEDIUM", "LOW"].map((p) => {
              const active = prioFilter.includes(p);
              return (
              <button key={p} onClick={() => toggleFilter(p, prioFilter, setPrioFilter)}
                className={`px-4 py-1 text-xs font-mono transition-all border`}
                style={{ 
                  background: active ? "rgba(255,255,255,0.1)" : "transparent", 
                  color: active ? "#e0f2ff" : "var(--cyber-muted)", 
                  borderColor: active ? "var(--cyber-cyan)" : "var(--cyber-border)",
                  clipPath: "polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)"
                }}>
                {p}
              </button>
            )})}
          </div>
        </div>
        <div>
          <p className="text-[10px] mb-3 text-cyber-muted font-mono tracking-widest uppercase">Filter / Risk Level</p>
          <div className="flex gap-3">
            {["HIGH", "MEDIUM", "LOW", "SAFE"].map((r) => {
              const active = riskFilter.includes(r);
              const rc = getRiskColor(r);
              return (
              <button key={r} onClick={() => toggleFilter(r, riskFilter, setRiskFilter)}
                className="px-4 py-1 text-xs font-mono transition-all border"
                style={{ 
                  background: active ? `${rc}22` : "transparent", 
                  color: active ? rc : "var(--cyber-muted)", 
                  borderColor: active ? rc : "var(--cyber-border)",
                  clipPath: "polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)",
                  boxShadow: active ? `0 0 10px ${rc}44` : "none"
                }}>
                {r}
              </button>
            )})}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((s) => {
          const rl = riskLookup[s.shipment_id] ?? "SAFE";
          const rc = getRiskColor(rl);
          return (
            <div key={s.shipment_id} className="relative p-4 flex items-center gap-6 bg-black/40 border border-cyber-border hover:border-cyber-cyan transition-colors"
                 style={{ borderLeft: `4px solid ${rc}` }}>
              <div className="p-3 bg-black border border-cyber-border min-w-[100px] text-center" style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)" }}>
                <div className="font-mono font-bold text-lg" style={{ color: rc, textShadow: `0 0 8px ${rc}80` }}>{s.shipment_id}</div>
                <div className="text-[10px] mt-1 text-cyber-muted uppercase tracking-widest">{s.delivery_priority} PR</div>
              </div>
              <div className="flex-1">
                <div className="font-bold text-cyber-text text-lg uppercase tracking-wide flex items-center gap-3">
                  {s.origin} <span className="text-cyber-cyan font-mono">-&gt;</span> {s.destination}
                </div>
                <div className="text-xs mt-2 text-cyber-muted font-mono flex gap-4">
                  <span>🛣️ {s.route_highway}</span>
                  <span className="text-cyber-border">|</span>
                  <span>📦 {s.cargo_type ?? "CARGO"}</span>
                  <span className="text-cyber-border">|</span>
                  <span>⚖️ {s.weight_kg ?? 0} KG</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                {s.estimated_delivery_time && (
                  <div className="text-xs font-mono text-cyber-muted bg-white/5 px-2 py-1 border border-cyber-border">
                    ETA: {new Date(s.estimated_delivery_time).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase()}
                  </div>
                )}
                <span className="px-3 py-1 text-[10px] font-bold font-mono tracking-widest uppercase border"
                  style={{ background: `${rc}11`, color: rc, borderColor: rc, boxShadow: `0 0 10px ${rc}44` }}>
                  [{rl} RISK]
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

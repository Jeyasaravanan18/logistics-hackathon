"use client";
import { useState } from "react";
import type { Recommendation, PipelineInfo } from "@/types";
import AgentTrace from "@/components/AgentTrace";

const COLORS: Record<string, string> = { HIGH: "var(--cyber-pink)", MEDIUM: "var(--cyber-yellow)", LOW: "var(--cyber-green)", SAFE: "var(--cyber-cyan)" };

interface Props {
  recommendations: Recommendation[];
  pipeline?: PipelineInfo;
}

export default function RecommendationCards({ recommendations, pipeline }: Props) {
  const [filter, setFilter] = useState("All");

  const filters = ["All", "HIGH", "MEDIUM", "LOW", "SAFE"];
  const shown = recommendations.filter((r) => filter === "All" || r.risk_level === filter);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-cyber-text uppercase tracking-widest font-mono">
        <span className="text-cyber-green mr-2">::</span> AI Strategy Output
      </h2>
      <p className="text-[10px] mb-8 text-cyber-muted font-mono tracking-[0.2em] uppercase">
        Neural pipeline decision tracing and actionable routing directives.
      </p>

      {pipeline && <AgentTrace pipeline={pipeline} />}

      {/* Filter Terminal Controls */}
      <div className="flex gap-4 mb-8 border-b border-cyber-border pb-4">
        {filters.map((f) => {
          const active = filter === f;
          const rc = f === "All" ? "var(--cyber-cyan)" : COLORS[f];
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="px-6 py-2 text-xs font-mono font-bold transition-all border uppercase tracking-widest"
              style={{
                background: active ? `${rc}22` : "transparent",
                color: active ? rc : "var(--cyber-muted)",
                borderColor: active ? rc : "var(--cyber-border)",
                clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
                boxShadow: active ? `0 0 15px ${rc}66` : "none"
              }}>
              {f === "All" ? "OVERRIDE_ALL" : `FLT_${f}`}
            </button>
          )
        })}
      </div>

      <div className="space-y-6">
        {shown.map((rec) => {
          const rc = COLORS[rec.risk_level];
          return (
            <div key={rec.shipment_id} className="relative p-6 border bg-black/60 overflow-hidden"
              style={{
                borderColor: "var(--cyber-border)",
                borderTopColor: rc,
                borderTopWidth: "2px",
              }}>
              
              {/* Scanline overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>

              {/* Header */}
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-cyber-border">
                <div>
                  <div className="font-mono font-bold text-xl mb-1 flex items-center gap-3">
                    <span style={{ color: rc, textShadow: `0 0 10px ${rc}` }}>{rec.shipment_id}</span>
                    <span className="text-cyber-border">|</span>
                    <span className="text-cyber-text tracking-wide">{rec.origin} -&gt; {rec.destination}</span>
                  </div>
                  <div className="text-[11px] font-mono text-cyber-muted uppercase tracking-widest flex items-center gap-3">
                    <span>{rec.route_highway}</span>
                    <span className="text-cyber-border">/</span>
                    <span>{rec.cargo_type}</span>
                    <span className="text-cyber-border">/</span>
                    <span className="text-cyber-cyan">PRIORITY: {rec.delivery_priority}</span>
                  </div>
                </div>
                <div className="px-4 py-1 text-xs font-mono font-bold tracking-[0.2em] border uppercase"
                  style={{ color: rc, borderColor: rc, background: `${rc}11`, boxShadow: `0 0 10px ${rc}44` }}>
                  {rec.risk_level}_THREAT
                </div>
              </div>

              {rec.risk_level !== "SAFE" ? (
                <div className="grid grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-cyber-pink shadow-neon-pink"></div>
                        <div className="text-[10px] font-bold font-mono text-cyber-pink uppercase tracking-[0.2em]">Threat Analysis</div>
                      </div>
                      <p className="text-xs font-mono text-cyber-muted leading-relaxed border-l border-cyber-border pl-3 ml-[3px]">
                        {rec.reason}
                        {rec.distance_to_disruption_km && ` PROXIMITY: ${rec.distance_to_disruption_km.toFixed(0)}KM.`}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-cyber-cyan shadow-neon-cyan"></div>
                        <div className="text-[10px] font-bold font-mono text-cyber-cyan uppercase tracking-[0.2em]">Action Directive</div>
                      </div>
                      <p className="text-xs font-mono text-cyber-text leading-relaxed border-l border-cyber-border pl-3 ml-[3px] bg-cyber-cyan/5 p-2">
                        {rec.suggested_action}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {rec.alternate_route && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 bg-cyber-purple"></div>
                          <div className="text-[10px] font-bold font-mono text-cyber-purple uppercase tracking-[0.2em]">Route Override</div>
                        </div>
                        <p className="text-xs font-mono text-cyber-muted border border-cyber-purple/30 bg-cyber-purple/5 p-3">
                          {rec.alternate_route}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {rec.estimated_delay_hours != null && (
                        <div>
                          <div className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest mb-1">Time Dilation</div>
                          <div className="text-2xl font-mono font-bold text-cyber-yellow" style={{ textShadow: "0 0 10px rgba(252, 238, 10, 0.5)" }}>
                            +{rec.estimated_delay_hours}H
                          </div>
                        </div>
                      )}
                      {rec.disruption_type && (
                        <div>
                          <div className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest mb-1">Anomaly Type</div>
                          <div className="text-xs font-mono text-cyber-pink border border-cyber-pink/30 px-2 py-1 inline-block mt-1 bg-cyber-pink/10">
                            {rec.disruption_type}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-cyber-green/50 bg-cyber-green/5 p-4 relative z-10 flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyber-green shadow-neon-green"></div>
                  <span className="text-xs font-mono text-cyber-green uppercase tracking-wide">
                    {rec.reason || "SYS.CHECK_OK: TARGET TRAJECTORY NOMINAL."}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

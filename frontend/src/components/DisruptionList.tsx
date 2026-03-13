"use client";
import type { Disruption } from "@/types";

const COLORS: Record<string, string> = { HIGH: "var(--cyber-pink)", MEDIUM: "var(--cyber-yellow)", LOW: "var(--cyber-green)" };

interface Props {
  disruptions: Disruption[];
  collectorReasoning?: string;
}

export default function DisruptionList({ disruptions, collectorReasoning }: Props) {
  const sevCounts = disruptions.reduce<Record<string, number>>((acc, d) => {
    acc[d.severity] = (acc[d.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-cyber-text uppercase tracking-widest font-mono">
        <span className="text-cyber-yellow mr-2">::</span> Anomaly Detection
      </h2>

      {collectorReasoning && (
        <div className="mb-8 p-4 bg-black/50 border border-cyber-cyan/50 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyber-cyan shadow-neon-cyan"></div>
          <p className="text-[11px] font-mono text-cyber-cyan leading-relaxed ml-3 relative z-10">
            <span className="font-bold mr-2">&gt; SYS.LOG:</span> {collectorReasoning}
          </p>
        </div>
      )}

      {/* Cyber Severity Counters */}
      <div className="flex gap-6 mb-8 border-b border-cyber-border pb-8">
        {Object.entries(COLORS).map(([sev, color]) => {
          const count = sevCounts[sev] || 0;
          return (
          <div key={sev} className="flex-1 border bg-black/40 p-4 text-center relative"
            style={{ borderColor: color }}>
            <div className="absolute top-0 right-0 w-4 h-4 border-l border-b bg-transparent" style={{ borderColor: color }}></div>
            <div className="text-4xl font-mono font-bold" style={{ color: color, textShadow: count > 0 ? `0 0 15px ${color}` : 'none' }}>
              {count}
            </div>
            <div className="text-[10px] mt-2 font-mono uppercase tracking-[0.3em] font-bold" style={{ color: "var(--cyber-text)" }}>
              {sev}_LVL
            </div>
          </div>
        )})}
      </div>

      {disruptions.length === 0 && (
        <div className="px-6 py-12 border border-cyber-green bg-cyber-green/5 text-center">
          <div className="text-cyber-green font-mono uppercase tracking-widest text-sm shadow-neon-green inline-block p-2">
            [[ NO ANOMALIES DETECTED. SECTOR CLEAR. ]]
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {disruptions.map((d) => (
          <div key={d.id} className="p-5 bg-black/60 border cyber-panel"
            style={{ borderColor: "var(--cyber-border)", borderLeft: `3px solid ${COLORS[d.severity]}` }}>
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-cyber-border">
              <div>
                <div className="font-mono font-bold text-cyber-text flex items-center gap-2 mb-1">
                  <span style={{ color: COLORS[d.severity], textShadow: `0 0 8px ${COLORS[d.severity]}80` }}>{d.severity === "HIGH" ? "[!]" : "[/]"}</span>
                  {d.subtype}
                </div>
                <div className="text-[10px] uppercase font-mono tracking-widest text-cyber-muted">
                  SRC: {d.source}
                </div>
              </div>
              <div className="px-2 py-1 text-[9px] font-mono font-bold tracking-widest border uppercase"
                style={{ color: COLORS[d.severity], borderColor: COLORS[d.severity], background: `${COLORS[d.severity]}15` }}>
                {d.severity}_LVL
              </div>
            </div>
            
            <p className="text-xs font-mono text-cyber-muted mb-4 h-12 overflow-hidden">{d.description}</p>
            
            <div className="flex justify-between items-end border-t border-cyber-border pt-3">
              <div className="text-[10px] font-mono text-cyber-cyan uppercase tracking-widest">
                LOC: {d.location}
              </div>
              <div className="text-[9px] font-mono text-cyber-muted">
                {d.timestamp?.replace("T", " ")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

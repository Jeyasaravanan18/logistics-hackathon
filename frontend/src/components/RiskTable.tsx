"use client";
import type { Recommendation } from "@/types";

const COLORS: Record<string, string> = { HIGH: "var(--cyber-pink)", MEDIUM: "var(--cyber-yellow)", LOW: "var(--cyber-green)", SAFE: "var(--cyber-cyan)" };

interface Props {
  recommendations: Recommendation[];
  riskBreakdown: { HIGH: number; MEDIUM: number; LOW: number; SAFE: number };
}

export default function RiskTable({ recommendations, riskBreakdown }: Props) {
  const total = Object.values(riskBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-cyber-text uppercase tracking-widest font-mono">
        <span className="text-cyber-cyan mr-2">::</span> Threat Matrix Analysis
      </h2>

      {/* Cyber Breakdown Readout */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {(["HIGH", "MEDIUM", "LOW", "SAFE"] as const).map((level) => {
          const count = riskBreakdown[level];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const color = COLORS[level];
          return (
            <div key={level} className="relative p-[1px] group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              {/* Outer Glowing Gradient Frame */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(45deg, ${color}30 0%, transparent 30%, transparent 70%, ${color}30 100%)`, clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
              ></div>
              
              <div className="relative h-full bg-black/70 backdrop-blur-lg p-5 flex flex-col overflow-hidden"
                   style={{ 
                     clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
                     borderLeft: `4px solid ${color}`,
                     boxShadow: `inset 0 0 30px ${color}10` 
                   }}>
                
                {/* Tech Accent Lines */}
                <div className="absolute top-0 right-0 w-12 h-12 opacity-20 border-r-2 border-t-2" style={{ borderColor: color, clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
                <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none group-hover:opacity-30 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                
                <div className="relative z-10 pl-2">
                  <div className="text-[10px] uppercase font-bold tracking-[0.3em] mb-2" style={{ color: "var(--cyber-text)" }}>{level} PROBABILITY</div>
                  <div className="text-5xl font-display font-extrabold" style={{ color, textShadow: `0 0 15px ${color}60` }}>{count}</div>
                  
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <div className="text-xs font-mono font-bold text-cyber-muted">VOLATILITY:</div>
                    <div className="text-sm font-display font-bold px-2 py-0.5" style={{ color: "var(--cyber-bg)", backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}>
                      {pct}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cyber Progress Bar */}
      <div className="h-1 mb-8 flex bg-cyber-bg border-y border-cyber-border overflow-hidden">
        {(["HIGH", "MEDIUM", "LOW", "SAFE"] as const).map((level) => {
          const pct = total > 0 ? (riskBreakdown[level] / total) * 100 : 0;
          return pct > 0 ? (
            <div key={level} style={{ width: `${pct}%`, background: COLORS[level], boxShadow: `0 0 10px ${COLORS[level]}` }} className="transition-all duration-1000"></div>
          ) : null;
        })}
      </div>

      {/* Data Grid */}
      <div className="border border-cyber-border bg-black/50 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cyber-cyan/10 border-b border-cyber-cyan">
              {["Target ID", "Vector", "Highway", "Cargo", "Priority", "Threat", "Dist", "Delay"].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-mono text-cyber-cyan font-bold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {recommendations.map((r, i) => {
              const rc = COLORS[r.risk_level];
              return (
                <tr key={r.shipment_id}
                  className={`border-b border-cyber-border transition-colors hover:bg-white/5 ${i % 2 === 0 ? "bg-transparent" : "bg-black/20"}`}>
                  <td className="px-4 py-3 font-bold" style={{ color: rc, textShadow: `0 0 5px ${rc}80` }}>{r.shipment_id}</td>
                  <td className="px-4 py-3 text-cyber-text truncate max-w-[150px]">{r.origin} - {r.destination}</td>
                  <td className="px-4 py-3 text-cyber-muted">{r.route_highway}</td>
                  <td className="px-4 py-3 text-cyber-muted">{r.cargo_type}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 border text-[9px] tracking-widest"
                      style={{ background: `rgba(255,255,255,0.05)`, color: "var(--cyber-text)", borderColor: "var(--cyber-border)" }}>
                      {r.delivery_priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 border text-[9px] tracking-widest font-bold"
                      style={{ background: `${rc}15`, color: rc, borderColor: rc, boxShadow: `0 0 5px ${rc}44` }}>
                      {r.risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cyber-muted">{r.distance_to_disruption_km?.toFixed(0) ? `${r.distance_to_disruption_km.toFixed(0)}KM` : "N/A"}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: r.estimated_delay_hours ? "var(--cyber-yellow)" : "var(--cyber-green)" }}>
                    {r.estimated_delay_hours ? `+${r.estimated_delay_hours}H` : "0H"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

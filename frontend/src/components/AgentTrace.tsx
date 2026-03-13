"use client";
import { useState } from "react";
import type { PipelineInfo } from "@/types";

export default function AgentTrace({ pipeline }: { pipeline: PipelineInfo }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-8 border border-cyber-border bg-black/60 cyber-panel">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{open ? "▼" : "▶"}</span>
          <span className="font-mono font-bold text-cyber-purple tracking-widest uppercase">
            [SYS.TRACE] Agent Pipeline Logs
          </span>
        </div>
        <div className="text-xs font-mono text-cyber-muted tracking-[0.2em] uppercase">
          {pipeline.disruptions_collected} Signals / {pipeline.shipments_evaluated} Targets 
        </div>
      </button>

      {open && (
        <div className="p-4 border-t border-cyber-border font-mono text-xs text-cyber-muted space-y-4 bg-black/80 relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none group-hover:animate-pulse-scan"></div>
          
          <div className="relative z-10">
            <div className="font-bold text-cyber-cyan mb-2 uppercase tracking-widest">:: DataCollectorAgent</div>
            <p className="pl-4 border-l border-cyber-cyan/30 text-cyber-text leading-relaxed bg-cyber-cyan/5 p-2">
              {pipeline.collector_reasoning}
            </p>
          </div>

          <div className="relative z-10">
            <div className="font-bold text-cyber-yellow mb-2 uppercase tracking-widest">:: RiskEvaluatorAgent</div>
            <p className="pl-4 border-l border-cyber-yellow/30 text-cyber-text leading-relaxed bg-cyber-yellow/5 p-2">
              Cross-referenced {pipeline.disruptions_collected} active anomalies against {pipeline.shipments_evaluated} active supply line trajectories. 
              Identified {pipeline.risk_breakdown.HIGH} HIGH, {pipeline.risk_breakdown.MEDIUM} MEDIUM, and {pipeline.risk_breakdown.LOW} LOW threat intersections.
            </p>
          </div>

          <div className="relative z-10">
            <div className="font-bold text-cyber-pink mb-2 uppercase tracking-widest">:: RecommendationAgent</div>
            <p className="pl-4 border-l border-cyber-pink/30 text-cyber-text leading-relaxed bg-cyber-pink/5 p-2 mb-2">
              Synthesized evasion strategies and delay calculations across all non-nominal routes. Re-routing vectors compiled.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

interface Props {
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: string;
}

export default function Sidebar({ onRefresh, loading, lastUpdated }: Props) {
  return (
    <aside className="w-64 min-h-screen p-6 flex flex-col cyber-panel border-r border-cyber-border mr-4">
      <div className="mb-8 relative">
        <div className="text-3xl font-extrabold mb-1 cyber-glitch-text text-cyber-cyan" data-text="LogiGuard AI">LogiGuard AI</div>
        <div className="text-[10px] text-cyber-muted uppercase tracking-[0.2em] mt-2">Disruption System v2.0</div>
        <div className="absolute -left-2 top-2 w-1 h-12 bg-cyber-cyan shadow-neon-cyan"></div>
      </div>

      <button onClick={onRefresh} disabled={loading}
        className={`w-full py-3 px-4 mb-8 text-xs ${loading ? 'opacity-50 cursor-not-allowed border-cyber-muted text-cyber-muted' : 'cyber-button'}`}
      >
        {loading ? "> INITIALIZING..." : "> REFRESH DATA"}
      </button>

      <div className="mb-8">
        <div className="text-[10px] font-bold mb-4 uppercase tracking-[0.2em] text-cyber-muted border-b border-cyber-border pb-2">Data Sources</div>
        <StatusDot label="OpenWeatherMap" color="var(--cyber-green)" glow="shadow-neon-green" />
        <StatusDot label="GNews Neural Net" color="var(--cyber-green)" glow="shadow-neon-green" />
        <StatusDot label="Gemini AI Core" color="var(--cyber-yellow)" glow="shadow-[0_0_10px_rgba(252,238,10,0.5)]" />
      </div>

      <div className="mb-8">
        <div className="text-[10px] font-bold mb-4 uppercase tracking-[0.2em] text-cyber-muted border-b border-cyber-border pb-2">Agent Pipeline</div>
        {["1. Data Collector", "2. Disruption Analyzer", "3. Risk Evaluator", "4. Strategy Gen"].map((a) => (
          <div key={a} className="text-[11px] mb-2 p-2 border border-cyber-border bg-black/40 text-cyber-cyan font-mono relative overflow-hidden group">
            <div className="absolute inset-0 bg-cyber-cyan/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
            <span className="relative z-10">&gt; {a}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto text-[10px] font-mono text-cyber-muted flex flex-col gap-1">
        {lastUpdated && <div>SYS.SYNC: {lastUpdated}</div>}
        <div>UPLINK: ACTIVE</div>
        <div>PORT: 8000</div>
      </div>
    </aside>
  );
}

function StatusDot({ label, color, glow }: { label: string; color: string; glow: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-2 h-2 rounded-none bg-[${color}] ${glow}`} style={{ backgroundColor: color }}></div>
      <span className="text-[11px] text-cyber-text font-mono tracking-wider">{label}</span>
      <span className="ml-auto text-[10px] text-cyber-green font-mono">OK</span>
    </div>
  );
}

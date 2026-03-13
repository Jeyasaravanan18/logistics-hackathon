"use client";

interface Props {
  label: string;
  value: number;
  color: string;
}

export default function KpiCard({ label, value, color }: Props) {
  return (
    <div className="relative p-[1px] group w-full transition-all duration-300 hover:scale-[1.02]">
      {/* Outer Glowing Border */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${color}40 0%, transparent 40%, transparent 60%, ${color}40 100%)`, clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
      ></div>

      <div className="relative h-full bg-black/60 backdrop-blur-md p-5 flex flex-col justify-center items-center overflow-hidden"
           style={{
             clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
             borderLeft: `3px solid ${color}`,
             boxShadow: `inset 0 0 20px ${color}15`
           }}>
        
        {/* Background Grid & Scanlines */}
        <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20 blur-sm pointer-events-none group-hover:animate-pulse-scan" style={{ top: '50%' }}></div>

        {/* Value Display */}
        <div className="relative z-10 text-5xl font-extrabold font-display tracking-tighter mb-1" 
             style={{ 
               color, 
               textShadow: `0 0 15px ${color}80, 0 0 30px ${color}40`
             }}>
          {value.toString().padStart(2, '0')}
        </div>
        
        {/* Label Display */}
        <div className="relative z-10 text-[11px] uppercase tracking-[0.3em] font-bold text-cyber-text/80 group-hover:text-cyber-text transition-colors duration-300">
          {label}
        </div>

        {/* Decorative Tech Corners */}
        <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-cyber-text/30 pointer-events-none"></div>
        <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-cyber-text/30 pointer-events-none"></div>
      </div>
    </div>
  );
}

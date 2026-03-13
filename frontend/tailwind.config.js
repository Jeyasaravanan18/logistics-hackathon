/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#050510", // super dark blue-black
          panel: "rgba(10, 15, 30, 0.7)", // glassmorphism cyber panel completely transparent
          border: "#1a2c4c", // muted cyber border
          cyan: "#00f0ff", // pure neon cyan
          pink: "#ff003c", // neon hot pink
          yellow: "#fcee0a", // cyber yellow
          green: "#00ff41", // matrix green
          purple: "#9d44fd", // deep neon purple
          text: "#e0f2ff", // bright cyber white
          muted: "#6b8ab3", // faded tech text
        },
      },
      fontFamily: {
        sans: ["var(--font-rajdhani)", "system-ui", "sans-serif"],
        mono: ["var(--font-orbitron)", "monospace"],
        display: ["var(--font-orbitron)", "sans-serif"],
      },
      backgroundImage: {
        'cyber-grid': `linear-gradient(to right, rgba(0, 240, 255, 0.05) 1px, transparent 1px),
                       linear-gradient(to bottom, rgba(0, 240, 255, 0.05) 1px, transparent 1px)`,
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)',
        'neon-pink': '0 0 10px rgba(255, 0, 60, 0.5), 0 0 20px rgba(255, 0, 60, 0.3)',
        'neon-yellow': '0 0 10px rgba(252, 238, 10, 0.5)',
        'neon-green': '0 0 10px rgba(0, 255, 65, 0.5)',
      },
      animation: {
        'glitch': 'glitch 1s linear infinite',
        'pulse-scan': 'pulse-scan 3s ease-in-out infinite',
      },
      keyframes: {
        glitch: {
          '2%, 64%': { transform: 'translate(2px,0) skew(0deg)' },
          '4%, 60%': { transform: 'translate(-2px,0) skew(0deg)' },
          '62%': { transform: 'translate(0,0) skew(5deg)' },
        },
        'pulse-scan': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '0.3' },
        }
      }
    },
  },
  plugins: [],
};

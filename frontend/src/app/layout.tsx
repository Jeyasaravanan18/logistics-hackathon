import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-rajdhani" });

export const metadata: Metadata = {
  title: "Logistics Disruption Intelligence Agent",
  description: "Real-time AI-powered disruption monitoring for logistics routes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <body>{children}</body>
    </html>
  );
}

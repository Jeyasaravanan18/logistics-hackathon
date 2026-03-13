"use client";
import { useEffect, useRef } from "react";
import type { Shipment, Disruption, Recommendation } from "@/types";

const COLORS: Record<string, string> = { HIGH: "#ff4757", MEDIUM: "#ffa502", LOW: "#2ed573", SAFE: "#00f0ff" };

interface Props {
  shipments: Shipment[];
  disruptions: Disruption[];
  recommendations: Recommendation[];
}

export default function MapView({ shipments, disruptions, recommendations }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null); // Store the Leaflet instance

  const riskLookup = Object.fromEntries(recommendations.map((r) => [r.shipment_id, r.risk_level]));

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      if (!isMounted || mapInstanceRef.current) return;

      const map = L.map(mapRef.current!, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });

      // Dark tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        opacity: 0.5,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add shipment markers
      shipments.forEach((s) => {
        const rl = riskLookup[s.shipment_id] ?? "SAFE";
        const color = COLORS[rl];

        const icon = L.divIcon({
          html: `<div style="
            width:18px;height:18px;border-radius:0;
            background:${color}40;border:2px solid ${color};
            box-shadow:0 0 10px ${color};
            clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          "></div>`,
          iconSize: [18, 18],
          className: "",
        });

        L.marker([s.latitude, s.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: monospace;">
              <b style="color: ${color}; font-size: 16px;">[${s.shipment_id}]</b><br/>
              <span style="color: #e0f2ff">${s.origin} -> ${s.destination}</span><br/>
              <span style="color: #6b8ab3; font-size:10px;">
                TRK: ${s.route_highway} | PRIORITY: ${s.delivery_priority}
              </span><br/>
              <span style="color:${color};font-weight:bold;margin-top:5px;display:block;">STATUS: ${rl}_RISK</span>
            </div>
          `);
      });

      // Add disruption zones
      disruptions.forEach((d) => {
        if (!d.lat || !d.lon) return;
        const radius = { HIGH: 80000, MEDIUM: 50000, LOW: 30000 }[d.severity] ?? 40000;
        const color = COLORS[d.severity] || COLORS.HIGH;

        L.circle([d.lat, d.lon], {
          radius,
          color: color,
          fillColor: color,
          fillOpacity: 0.1,
          weight: 1.5,
          dashArray: "4 4",
        })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: monospace;">
              <b style="color: ${color}; font-size: 14px;">SYS.ANOMALY // ${d.subtype}</b><br/>
              <span style="color: #e0f2ff">LOC: ${d.location}</span><br/>
              <span style="color: #6b8ab3; font-size:10px;">${d.description.slice(0, 100)}...</span><br/>
              <span style="color:${color};font-weight:bold;margin-top:5px;display:block;">SEV: ${d.severity}</span>
            </div>
          `);
      });
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [shipments, disruptions, recommendations, riskLookup]);

  return (
    <div className="relative">
      <div className="flex justify-between items-end mb-6 border-b border-cyber-border pb-4">
        <h2 className="text-xl font-bold text-cyber-text uppercase tracking-widest font-mono">
          <span className="text-cyber-cyan mr-2">::</span> Geolocational Matrix
        </h2>
      </div>

      <div 
        ref={mapRef} 
        className="w-full h-[600px] border-2 border-cyber-border cyber-panel ring-1 ring-cyber-cyan/30 shadow-[0_0_20px_rgba(0,240,255,0.1)] relative z-0"
      />
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import type { AgentLocationEvent } from "@/lib/operacao/hotspots";
import { loadGoogleMaps } from "./google-map-viewport";

type Props = { events: AgentLocationEvent[]; showAgents: boolean };

export function GoogleHotspotMap({ events, showAgents }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    void loadGoogleMaps().then(() => {
      if (disposed || !ref.current || !window.google?.maps) return;
      const maps = window.google.maps;
      const map = new maps.Map(ref.current, {
        center: { lat: -7.936, lng: -35.293 },
        zoom: 14,
        mapId: "VIGIA_DEMO_MAP",
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
      map.data.loadGeoJson("/geo/ibge-lagoa-itaenga-setores.geojson");
      map.data.setStyle({
        strokeColor: "#006b4f",
        strokeWeight: 1.5,
        fillColor: "#54b88d",
        fillOpacity: 0.18,
      });
      events
        .filter((event) => showAgents || event.kind === "foco")
        .forEach((event) => {
          const marker = new maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: event.latitude, lng: event.longitude },
            title: `${event.agentId} · ${event.kind}`,
          });
          marker.addListener("click", () => undefined);
        });
    });
    return () => {
      disposed = true;
    };
  }, [events, showAgents]);
  return (
    <div
      ref={ref}
      className="h-full min-h-[360px] w-full"
      aria-label="Google Maps com hotspots e posições dos agentes"
    />
  );
}

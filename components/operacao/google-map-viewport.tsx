"use client";

import { useEffect, useRef, useState } from "react";
import type { SectorPropertyMock } from "@/lib/visitas/demo-data";

declare global {
  // O script oficial injeta este namespace em runtime.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace google.maps {
    type LatLngLiteral = { lat: number; lng: number };
    class Map {
      constructor(element: HTMLElement, options: Record<string, unknown>);
      fitBounds(bounds: LatLngBounds): void;
      data: Data;
    }
    class Polygon {
      constructor(options: Record<string, unknown>);
      addListener(event: string, callback: () => void): void;
    }
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace marker {
      class AdvancedMarkerElement {
        constructor(options: Record<string, unknown>);
        addListener(event: string, callback: () => void): void;
      }
    }
    class Marker {
      constructor(options: Record<string, unknown>);
      addListener(event: string, callback: () => void): void;
    }
    class InfoWindow {
      setContent(content: string): void;
      setPosition(position: LatLngLiteral): void;
      open(options: { map: Map }): void;
      close(): void;
    }
    class LatLngBounds {
      extend(position: LatLngLiteral): void;
    }
    class Data {
      loadGeoJson(url: string, callback?: (features: unknown[]) => void): void;
      setStyle(style: Record<string, unknown>): void;
      addListener(
        event: string,
        callback: (event: { feature: Feature; latLng?: LatLngLiteral }) => void,
      ): void;
    }
    class Feature {
      getProperty(name: string): unknown;
    }
  }
  interface Window {
    google?: typeof google;
  }
}

type GoogleMapViewportProps = {
  properties: SectorPropertyMock[];
  onSelectProperty: (property: SectorPropertyMock) => void;
};

const CENTER = { lat: -7.936, lng: -35.293 };
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-vigia-google-maps="true"]',
  );
  if (existing) {
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Falha ao carregar o Google Maps.")),
        { once: true },
      );
    });
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.dataset.vigiaGoogleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY ?? "")}&libraries=geometry,marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Falha ao carregar o Google Maps."));
    document.head.appendChild(script);
  });
}

export function GoogleMapViewport({
  properties,
  onSelectProperty,
}: GoogleMapViewportProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    API_KEY ? "loading" : "error",
  );

  useEffect(() => {
    if (!API_KEY) {
      return;
    }
    let cancelled = false;
    void loadGoogleMaps()
      .then(() => {
        if (cancelled || !elementRef.current || !window.google?.maps) return;
        const maps = window.google.maps;
        const map = new maps.Map(elementRef.current, {
          center: CENTER,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: "greedy",
          mapId: "VIGIA_DEMO_MAP",
        });
        mapRef.current = map;
        const info = new maps.InfoWindow();
        map.data.loadGeoJson("/geo/ibge-lagoa-itaenga-setores.geojson");
        map.data.setStyle({
          strokeColor: "#006b4f",
          strokeOpacity: 0.9,
          strokeWeight: 1.5,
          fillColor: "#54b88d",
          fillOpacity: 0.2,
        });
        map.data.addListener("mouseover", (event) => {
          const codigo = event.feature.getProperty("codigoSetor");
          const bairro =
            event.feature.getProperty("bairro") || "Setor censitário";
          info.setContent(
            `<strong>${bairro}</strong><br><small>Setor ${codigo}</small>`,
          );
          if (event.latLng) info.setPosition(event.latLng);
          info.open({ map });
        });
        map.data.addListener("mouseout", () => info.close());
        properties.forEach((property) => {
          const marker = new maps.marker.AdvancedMarkerElement({
            map,
            position: {
              lat: property.coordenadas.latitude,
              lng: property.coordenadas.longitude,
            },
            title: `${property.logradouro}, ${property.numero}`,
            label: String(property.sequenciaPercurso),
          });
          marker.addListener("click", () => onSelectProperty(property));
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      mapRef.current = null;
    };
  }, [onSelectProperty, properties]);

  if (status === "error") {
    return (
      <div className="flex h-full min-h-[360px] items-center justify-center bg-[#e8f0eb] p-6 text-center text-sm text-slate-700">
        <div>
          <p className="font-semibold">Mapa integrado ao Google Maps</p>
          <p className="mt-1 max-w-md">
            Configure <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> no ambiente
            para carregar o mapa e os limites dos bairros.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div
      ref={elementRef}
      className="h-full min-h-[360px] w-full"
      aria-label="Mapa do Google Maps com bairros segmentados"
    />
  );
}

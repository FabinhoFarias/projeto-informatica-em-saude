"use client";

import { useEffect, useRef, useState } from "react";

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
    gm_authFailure?: () => void;
  }
}

const CENTER = { lat: -7.936, lng: -35.293 };
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function loadGoogleMaps() {
  const waitUntilReady = () =>
    new Promise<void>((resolve, reject) => {
      const started = Date.now();
      const check = () => {
        if (window.google?.maps?.Map) return resolve();
        if (Date.now() - started > 15000) {
          return reject(
            new Error(
              "Google Maps carregou sem disponibilizar o construtor Map.",
            ),
          );
        }
        window.setTimeout(check, 50);
      };
      check();
    });
  if (window.google?.maps?.Map) return Promise.resolve();
  if (window.google?.maps) return waitUntilReady();
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
    }).then(waitUntilReady);
  }
  return new Promise<void>((resolve, reject) => {
    window.gm_authFailure = () => {
      console.error(
        "[Vigia+] Google Maps rejeitou a chave. Verifique HTTP referrers, API habilitada e faturamento.",
      );
    };
    const script = document.createElement("script");
    script.dataset.vigiaGoogleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY ?? "")}&libraries=geometry,marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Falha ao carregar o Google Maps."));
    document.head.appendChild(script);
  }).then(waitUntilReady);
}

export function GoogleMapViewport() {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    API_KEY ? "loading" : "error",
  );
  const [errorMessage, setErrorMessage] = useState(
    API_KEY
      ? ""
      : "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não foi encontrada no build.",
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
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const detail = error instanceof Error ? ` ${error.message}` : "";
          const message = `A API do Google Maps não carregou.${detail} Verifique o domínio autorizado, a Maps JavaScript API e o faturamento.`;
          console.error("[Vigia+] Google Maps:", message);
          setErrorMessage(message);
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
      mapRef.current = null;
    };
  }, []);

  if (status === "error") {
    return (
      <div className="flex h-full min-h-[360px] items-center justify-center bg-[#e8f0eb] p-6 text-center text-sm text-slate-700">
        <div>
          <p className="font-semibold">Mapa integrado ao Google Maps</p>
          <p className="mt-1 max-w-md">
            {errorMessage ||
              "Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no ambiente para carregar o mapa."}
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

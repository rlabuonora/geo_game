import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { type CameraFrame } from "../game/camera";
import { type CountryFeature } from "../game/mapData";
import { type ScreenState } from "../game/gameEngine";

type WorldMapProps = {
  countries: CountryFeature[];
  correctCountryCodes: string[];
  flashCountryCode: string | null;
  screen: ScreenState;
  onCountryClick?: (isoCode: string) => void;
  onCameraDebugChange?: (frame: CameraFrame | null, zoom: number | null) => void;
};

export function WorldMap({
  countries,
  correctCountryCodes,
  flashCountryCode,
  screen,
  onCountryClick,
  onCameraDebugChange
}: WorldMapProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const countriesLayerRef = useRef<L.LayerGroup | null>(null);
  const lastScreenRef = useRef<ScreenState | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      attributionControl: false,
      minZoom: 2,
      maxZoom: 6,
      worldCopyJump: true,
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      keyboard: true,
      touchZoom: true
    });

    map.setView([18, 8], 2);

    const tapHandler = (map as L.Map & { tap?: { disable: () => void } }).tap;
    tapHandler?.disable();

    mapRef.current = map;

    const resizeMap = () => {
      map.invalidateSize();
    };

    window.addEventListener("resize", resizeMap);
    window.setTimeout(resizeMap, 0);

    return () => {
      window.removeEventListener("resize", resizeMap);
      map.remove();
      mapRef.current = null;
      countriesLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    map.invalidateSize();
    countriesLayerRef.current?.remove();

    const foundSet = new Set(correctCountryCodes);
    const countriesLayer = L.layerGroup();

    const baseCountriesLayer = L.geoJSON(
      {
        type: "FeatureCollection",
        features: countries
      } as never,
      {
        style: (feature) => {
          return {
            color: "#8c8372",
            fillColor: "#f3ecd9",
            fillOpacity: 1,
            weight: 0.85,
            opacity: 1
          };
        },
        onEachFeature: (feature, layer) => {
          const isoCode = (feature as CountryFeature).properties.isoA3;

          layer.on("click", () => {
            if (screen === "playing" && onCountryClick) {
              onCountryClick(isoCode);
            }
          });
        }
      }
    );

    const correctCountriesLayer = L.geoJSON(
      {
        type: "FeatureCollection",
        features: countries.filter((country) => foundSet.has(country.properties.isoA3))
      } as never,
      {
        interactive: false,
        style: {
          color: "#6f8f5f",
          fillColor: "#b7d3a8",
          fillOpacity: 0.72,
          weight: 1.2
        }
      }
    );

    const flashLayer = L.geoJSON(
      {
        type: "FeatureCollection",
        features: countries.filter((country) => country.properties.isoA3 === flashCountryCode)
      } as never,
      {
        interactive: false,
        style: {
          color: "#c04b3f",
          fillColor: "transparent",
          fillOpacity: 0,
          weight: 2.2
        }
      }
    );

    baseCountriesLayer.addTo(countriesLayer);
    correctCountriesLayer.addTo(countriesLayer);
    flashLayer.addTo(countriesLayer);

    countriesLayer.addTo(map);
    countriesLayerRef.current = countriesLayer;

    const shouldResetView = lastScreenRef.current !== screen;

    if (shouldResetView) {
      const worldBounds = baseCountriesLayer.getBounds();

      if (worldBounds.isValid()) {
        map.stop();
        map.fitBounds(worldBounds.pad(0.35), {
          animate: false,
          maxZoom: 3
        });
      }
    }

    lastScreenRef.current = screen;

    onCameraDebugChange?.(null, map.getZoom());
  }, [
    countries,
    correctCountryCodes,
    flashCountryCode,
    onCameraDebugChange,
    onCountryClick,
    screen
  ]);

  return (
    <section className="map-card">
      <div ref={containerRef} className="world-map" role="img" aria-label={t("map.aria")} />
      <p className="map-attribution">{t("map.attribution")}</p>
    </section>
  );
}

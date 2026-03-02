import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { computeCameraForCountry, type CameraFrame } from "../game/camera";
import { getCountryByIsoOrThrow, type CountryFeature } from "../game/mapData";
import { type ScreenState } from "../game/gameEngine";

type WorldMapProps = {
  countries: CountryFeature[];
  activeCountryCode: string | null;
  foundCountryCodes: string[];
  screen: ScreenState;
  onCountryClick?: (isoCode: string) => void;
  onCameraDebugChange?: (frame: CameraFrame | null, zoom: number | null) => void;
};

export function WorldMap({
  countries,
  activeCountryCode,
  foundCountryCodes,
  screen,
  onCountryClick,
  onCameraDebugChange
}: WorldMapProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const countriesLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      attributionControl: false,
      minZoom: 2,
      maxZoom: 6,
      worldCopyJump: true,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false
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

    const foundSet = new Set(foundCountryCodes);
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

    const foundCountriesLayer = L.geoJSON(
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

    const targetCountriesLayer = L.geoJSON(
      {
        type: "FeatureCollection",
        features: countries.filter((country) => country.properties.isoA3 === activeCountryCode)
      } as never,
      {
        interactive: false,
        style: {
          color: "#c97a12",
          fillColor: "#f4c56a",
          fillOpacity: 0.6,
          weight: 1.35
        }
      }
    );

    baseCountriesLayer.addTo(countriesLayer);
    foundCountriesLayer.addTo(countriesLayer);
    targetCountriesLayer.addTo(countriesLayer);

    countriesLayer.addTo(map);
    countriesLayerRef.current = countriesLayer;

    if (!activeCountryCode || screen === "home") {
      const worldBounds = baseCountriesLayer.getBounds();

      if (worldBounds.isValid()) {
        map.stop();
        map.fitBounds(worldBounds.pad(0.35), {
          animate: false,
          maxZoom: 3
        });
      }

      onCameraDebugChange?.(null, map.getZoom());
      return;
    }

    const activeCountry = getCountryByIsoOrThrow(activeCountryCode);

    if (import.meta.env.DEV) {
      console.info("[geo-neighbors] highlight target", {
        targetIso: activeCountryCode,
        matchedIso: activeCountry.properties.isoA3,
        matchedName: activeCountry.properties.name
      });
    }

    if (activeCountry.properties.isoA3 !== activeCountryCode) {
      throw new Error(
        `Country highlight mismatch: requested ${activeCountryCode}, matched ${activeCountry.properties.isoA3}.`
      );
    }

    const frame = computeCameraForCountry(activeCountry, activeCountryCode);

    map.stop();
    map.fitBounds(frame.bounds, {
      animate: false,
      paddingTopLeft: frame.padding,
      paddingBottomRight: frame.padding,
      maxZoom: frame.maxZoom
    });

    onCameraDebugChange?.(frame, map.getBoundsZoom(frame.bounds, false, frame.padding));
  }, [
    activeCountryCode,
    countries,
    foundCountryCodes,
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

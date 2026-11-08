import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { type CameraFrame } from "../game/camera";
import { getCountryName } from "../game/countryNames";
import { type GamePhase } from "../game/gameEngine";
import { countryPolygons, type CountryFeature } from "../game/mapData";

function getOverviewBounds(map: L.Map) {
  const { x: width, y: height } = map.getSize();
  // Tall screens prioritize the dense cluster of countries around Africa and Europe.
  // Wide screens include the inhabited continents without polar or ocean margins.
  return width < height
    ? L.latLngBounds([-35, -25], [72, 100])
    : L.latLngBounds([-56, -170], [75, 180]);
}

type WorldMapProps = {
  countries: CountryFeature[];
  regionalMap?: boolean;
  correctCountryCodes: string[];
  revealedCountryCode?: string | null;
  flashCountryCode: string | null;
  screen: GamePhase;
  showCountryNames?: boolean;
  onMenu?: () => void;
  onCountryClick?: (isoCode: string) => void;
  onCameraDebugChange?: (frame: CameraFrame | null, zoom: number | null) => void;
};

export function WorldMap({
  countries,
  regionalMap = false,
  correctCountryCodes,
  revealedCountryCode = null,
  flashCountryCode,
  screen,
  showCountryNames = false,
  onMenu,
  onCountryClick,
  onCameraDebugChange
}: WorldMapProps) {
  const { i18n, t } = useTranslation();
  const language = i18n.language === "en" ? "en" : "es";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const countriesLayerRef = useRef<L.LayerGroup | null>(null);
  const initialZoomRef = useRef<number | null>(null);
  const previousRevealRef = useRef<string | null>(null);

  useEffect(() => {
    if (screen !== "playing") {
      return;
    }

    const isBlockedTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const tagName = target.tagName.toLowerCase();

      return (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        tagName === "button" ||
        target.isContentEditable
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isBlockedTarget(document.activeElement) || isBlockedTarget(event.target)) {
        return;
      }

      const map = mapRef.current;

      if (!map) {
        return;
      }

      const panOffset = 96;

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        map.zoomIn(undefined, { animate: true });
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        map.zoomOut(undefined, { animate: true });
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        map.panBy([0, -panOffset], { animate: true, duration: 0.25 });
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        map.panBy([0, panOffset], { animate: true, duration: 0.25 });
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        map.panBy([-panOffset, 0], { animate: true, duration: 0.25 });
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        map.panBy([panOffset, 0], { animate: true, duration: 0.25 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [screen]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      attributionControl: false,
      minZoom: 1,
      maxZoom: regionalMap ? 12 : 6,
      zoomSnap: 0.25,
      // flyToBounds handles camera animation; avoid pending CSS zoom transitions on mode changes.
      zoomAnimation: false,
      worldCopyJump: true,
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      keyboard: false,
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
      map.stop();
      map.remove();
      mapRef.current = null;
      countriesLayerRef.current = null;
      initialZoomRef.current = null;
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
    if (revealedCountryCode) {
      foundSet.add(revealedCountryCode);
    }
    const countriesLayer = L.layerGroup();

    if (regionalMap) {
      L.geoJSON({
        type: "FeatureCollection",
        features: countryPolygons.filter((country) =>
          !countries.some((region) => region.properties.parentIso === country.properties.isoA3)
        )
      } as never, {
        interactive: false,
        style: {
          color: "#a1a8ad",
          fillColor: "#c5cbd0",
          fillOpacity: 1,
          weight: 0.85
        }
      }).addTo(countriesLayer);
    }

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

          if (showCountryNames) {
            const label = document.createElement("span");
            label.textContent = getCountryName(isoCode, language);
            layer.bindTooltip(label, { sticky: true, direction: "top" });
          }

          layer.on("click", () => {
            if (screen === "playing" && !showCountryNames && onCountryClick) {
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
        style: (feature) => ({
          color: feature?.properties.isoA3 === revealedCountryCode ? "#b58b22" : "#6f8f5f",
          fillColor: feature?.properties.isoA3 === revealedCountryCode ? "#f4cf58" : "#b7d3a8",
          fillOpacity: 0.72,
          weight: 1.2
        })
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

    if (initialZoomRef.current == null) {
      const worldBounds = regionalMap ? baseCountriesLayer.getBounds().pad(0.08) : getOverviewBounds(map);

      if (worldBounds.isValid()) {
        map.stop();
        map.fitBounds(worldBounds, {
          animate: false,
          maxZoom: regionalMap ? 8 : 3
        });
        initialZoomRef.current = map.getZoom();
      }
    }

    onCameraDebugChange?.(null, map.getZoom());
  }, [
    countries,
    regionalMap,
    correctCountryCodes,
    revealedCountryCode,
    flashCountryCode,
    onCameraDebugChange,
    onCountryClick,
    showCountryNames,
    language,
    screen
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || regionalMap) {
      return;
    }

    const previousReveal = previousRevealRef.current;
    previousRevealRef.current = revealedCountryCode;
    if (!revealedCountryCode && !previousReveal) {
      return;
    }

    const bounds = revealedCountryCode ? L.geoJSON({
      type: "FeatureCollection",
      features: countries.filter((country) => country.properties.isoA3 === revealedCountryCode)
    } as never).getBounds() : regionalMap
      ? L.geoJSON({ type: "FeatureCollection", features: countries } as never).getBounds().pad(0.08)
      : getOverviewBounds(map);

    if (bounds.isValid()) {
      map.stop();
      map.flyToBounds(bounds, {
        animate: true,
        duration: 1.5,
        padding: revealedCountryCode ? [40, 40] : [0, 0],
        maxZoom: regionalMap ? (revealedCountryCode ? 10 : 8) : (revealedCountryCode ? 5 : 3)
      });
    }
  }, [countries, revealedCountryCode, regionalMap]);

  return (
    <section className="map-card">
      <div ref={containerRef} className="world-map" role="img" aria-label={t(regionalMap ? "map.departmentsAria" : "map.aria", { country: getCountryName(countries[0]?.properties.parentIso ?? "", language) })} />
      {onMenu && <button type="button" className="mode-menu-back" onClick={onMenu}>{t("menu.back")}</button>}
      <p className="map-attribution">{t(regionalMap && countries[0]?.properties.parentIso === "URY" ? "map.departmentsAttribution" : "map.attribution")}</p>
    </section>
  );
}

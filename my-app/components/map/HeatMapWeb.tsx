/**
 * HeatMapWeb — Leaflet implementation for web platform
 * Renders GeoJSON heat zones with color-coded overlays on a dark map.
 * Supports user location marker + auto-zoom.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { getRiskColor, getRiskOpacity, getRiskConfig } from '@/constants/RiskLevels';
import { hexToRgba } from '@/utils/colors';
import type { HeatZone, Region } from '@/types';

// CDN URLs for Leaflet assets
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const MARKER_ICON_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const MARKER_SHADOW_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

interface HeatMapWebProps {
    zones: HeatZone[];
    region: Region;
    onZonePress: (zone: HeatZone) => void;
    onRegionChange?: (region: Region) => void;
    /** User's current location — map will zoom here and show a marker */
    userLocation?: { latitude: number; longitude: number } | null;
}

/** Inject Leaflet CSS (run once) */
function injectLeafletCSS(): void {
    if (typeof document === 'undefined') return;
    if (document.querySelector('link[data-leaflet-css]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS;
    link.setAttribute('data-leaflet-css', 'true');
    document.head.appendChild(link);
}

/** Inject custom animations */
function injectAnimations(): void {
    if (typeof document === 'undefined') return;
    if (document.querySelector('style[data-heatwave-css]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-heatwave-css', 'true');
    style.textContent = `
    @keyframes hw-fade-in {
      from { opacity: 0; transform: scale(0.96); }
      to   { opacity: 1; transform: scale(1); }
    }
    .hw-zone { animation: hw-fade-in 0.35s ease-out; cursor: pointer; }
    @keyframes hw-pulse {
      0%, 100% { fill-opacity: 0.35; }
      50%      { fill-opacity: 0.55; }
    }
    .hw-zone-critical path { animation: hw-pulse 2s ease-in-out infinite; }
    .hw-zone-high path { animation: hw-pulse 3s ease-in-out infinite; }

    /* User location marker pulse */
    @keyframes user-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.6); }
      70%  { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
    .user-location-marker {
      background: #3B82F6;
      border: 3px solid #ffffff;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      animation: user-pulse 2s infinite;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    }

    .leaflet-popup-content-wrapper {
      background: rgba(15, 15, 26, 0.95) !important;
      color: #fff !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
      border: 1px solid rgba(255,255,255,0.08) !important;
    }
    .leaflet-popup-tip { background: rgba(15, 15, 26, 0.95) !important; }
    .leaflet-popup-close-button { color: #9ca3af !important; }
  `;
    document.head.appendChild(style);
}

function HeatMapWebInner({ zones, region, onZonePress, onRegionChange, userLocation }: HeatMapWebProps) {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<ReturnType<typeof import('leaflet')['map']> | null>(null);
    const zoneLayersRef = useRef<ReturnType<typeof import('leaflet')['layerGroup']> | null>(null);
    const userMarkerRef = useRef<ReturnType<typeof import('leaflet')['marker']> | null>(null);
    const leafletRef = useRef<typeof import('leaflet') | null>(null);
    const [ready, setReady] = useState(false);
    const hasZoomedToUser = useRef(false);

    // Initialize map
    useEffect(() => {
        if (typeof window === 'undefined') return;
        let cancelled = false;

        (async () => {
            injectLeafletCSS();
            injectAnimations();

            const L = (await import('leaflet')).default;
            if (cancelled || !mapRef.current) return;

            // Fix default marker icons
            L.Marker.prototype.options.icon = L.icon({
                iconUrl: MARKER_ICON_URL,
                shadowUrl: MARKER_SHADOW_URL,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
            });

            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
            }

            const map = L.map(mapRef.current, {
                center: [region.latitude, region.longitude],
                zoom: 8,
                attributionControl: false,
                zoomControl: true,
                preferCanvas: true,
            });

            // Dark map tiles
            L.tileLayer(
                'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                {
                    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 19,
                },
            ).addTo(map);

            // Attribution
            L.control
                .attribution({ position: 'bottomright', prefix: '' })
                .addAttribution('© OpenStreetMap')
                .addTo(map);

            leafletRef.current = L;
            mapInstanceRef.current = map;
            zoneLayersRef.current = L.layerGroup().addTo(map);
            setReady(true);
        })();

        return () => {
            cancelled = true;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // ── Zoom to user location when it becomes available ──
    useEffect(() => {
        const map = mapInstanceRef.current;
        const L = leafletRef.current;
        if (!map || !L || !ready || !userLocation) return;

        // Zoom to user location (only once)
        if (!hasZoomedToUser.current) {
            hasZoomedToUser.current = true;
            map.setView([userLocation.latitude, userLocation.longitude], 11, {
                animate: true,
                duration: 1.5,
            });
        }

        // Remove old user marker
        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
        }

        // Create pulsing blue dot marker for user location
        const userIcon = L.divIcon({
            className: '',
            html: '<div class="user-location-marker"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
        });

        userMarkerRef.current = L.marker(
            [userLocation.latitude, userLocation.longitude],
            { icon: userIcon, zIndexOffset: 1000 },
        )
            .addTo(map)
            .bindPopup(
                `<div style="font-family:system-ui,sans-serif;text-align:center;padding:4px;">
                    <div style="font-size:16px;margin-bottom:4px;">📍</div>
                    <div style="font-weight:800;font-size:13px;color:#fff;">Your Location</div>
                    <div style="font-size:10px;color:#9ca3af;margin-top:2px;">
                        ${userLocation.latitude.toFixed(4)}°N, ${userLocation.longitude.toFixed(4)}°E
                    </div>
                </div>`,
                { maxWidth: 200 },
            );
    }, [userLocation, ready]);

    // Update zones when data changes
    const updateZones = useCallback(() => {
        const map = mapInstanceRef.current;
        const L = leafletRef.current;
        const layerGroup = zoneLayersRef.current;
        if (!map || !L || !layerGroup || !ready) return;

        layerGroup.clearLayers();

        zones.forEach((zone) => {
            const color = getRiskColor(zone.properties.severity);
            const opacity = getRiskOpacity(zone.properties.severity);
            const config = getRiskConfig(zone.properties.severity);

            // Convert [lng, lat] to [lat, lng] for Leaflet
            const positions = zone.geometry.coordinates[0].map(
                (coord) => [coord[1], coord[0]] as [number, number],
            );

            const polygon = L.polygon(positions, {
                color: color,
                fillColor: color,
                fillOpacity: opacity,
                weight: 2,
                opacity: 0.8,
                className: `hw-zone hw-zone-${zone.properties.severity}`,
            });

            // Popup content
            const prob = (zone.properties.probability * 100).toFixed(1);
            const popup = `
        <div style="font-family: system-ui, sans-serif; min-width: 200px; padding: 4px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <span style="font-size:18px;">${config.icon}</span>
            <div>
              <div style="font-weight:800; font-size:14px; letter-spacing:-0.3px;">${zone.properties.name}</div>
              <div style="font-size:11px; color:#9ca3af; margin-top:2px;">${config.label}</div>
            </div>
          </div>
          <div style="display:flex; gap:16px; margin-bottom:10px;">
            <div>
              <div style="font-size:10px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">Probability</div>
              <div style="font-size:20px; font-weight:800; color:${color};">${prob}%</div>
            </div>
            <div>
              <div style="font-size:10px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">Temperature</div>
              <div style="font-size:20px; font-weight:800; color:#fff;">${zone.properties.temperature.toFixed(1)}°C</div>
            </div>
          </div>
          <div style="font-size:11px; color:#9ca3af; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;">
            ${config.action}
          </div>
        </div>
      `;

            polygon.bindPopup(popup, { maxWidth: 300, className: 'hw-popup' });
            polygon.on('click', () => onZonePress(zone));
            polygon.addTo(layerGroup);
        });

        // Fit bounds only if no user location (otherwise we already zoomed)
        if (zones.length > 0 && !userLocation) {
            const allCoords = zones.flatMap((z) =>
                z.geometry.coordinates[0].map((c) => [c[1], c[0]] as [number, number]),
            );
            if (allCoords.length > 0) {
                map.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50], maxZoom: 10 });
            }
        }
    }, [zones, ready, onZonePress, userLocation]);

    useEffect(() => {
        updateZones();
    }, [updateZones]);

    return (
        <View style={styles.container}>
            {!ready && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loaderText}>Loading map…</Text>
                </View>
            )}
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        </View>
    );
}

const HeatMapWeb = React.memo(HeatMapWebInner);
export default HeatMapWeb;

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
        zIndex: 10,
    },
    loaderText: {
        marginTop: 12,
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
});

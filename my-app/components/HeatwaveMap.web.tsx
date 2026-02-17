import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { RiskColors } from '@/constants/theme';
import type { RiskLevel, WeatherData } from '@/types/heatwave';

interface HeatwaveMapProps {
    riskLevel: RiskLevel;
    bbox: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
    probability?: number;
    advice?: string;
    weather?: WeatherData;
    date?: string;
    isFullScreen?: boolean;
}

// CDN URLs for Leaflet assets
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const MARKER_ICON_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const MARKER_SHADOW_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

/** Inject Leaflet CSS via <link> tag (SSR-safe) */
function injectLeafletCSS() {
    if (typeof document === 'undefined') return;
    if (document.querySelector('link[data-leaflet-css]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS;
    link.setAttribute('data-leaflet-css', 'true');
    document.head.appendChild(link);
}

/** Inject fade-in animation CSS */
function injectAnimationCSS() {
    if (typeof document === 'undefined') return;
    if (document.querySelector('style[data-heatwave-anim]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-heatwave-anim', 'true');
    style.textContent = `
        @keyframes heatwave-fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to   { opacity: 1; transform: scale(1); }
        }
        .heatwave-polygon {
            animation: heatwave-fade-in 0.4s ease-out;
        }
        @keyframes heatwave-pulse {
            0%, 100% { opacity: 0.25; }
            50%      { opacity: 0.45; }
        }
        .heatwave-polygon-high path,
        .heatwave-polygon-critical path {
            animation: heatwave-pulse 2s ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);
}

export default function HeatwaveMap({ riskLevel, bbox, probability, advice, weather, date, isFullScreen }: HeatwaveMapProps) {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<any>(null);
    const polygonRef = useRef<any>(null);
    const [ready, setReady] = useState(false);
    const leafletRef = useRef<any>(null);
    const color = RiskColors[riskLevel] || RiskColors.LOW;

    // Initialize map once
    useEffect(() => {
        if (typeof window === 'undefined') return;
        let cancelled = false;

        (async () => {
            injectLeafletCSS();
            injectAnimationCSS();

            const L = (await import('leaflet')).default;
            if (cancelled || !mapRef.current) return;

            L.Marker.prototype.options.icon = L.icon({
                iconUrl: MARKER_ICON_URL,
                shadowUrl: MARKER_SHADOW_URL,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
            });

            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
            }

            const centerLat = (bbox.north + bbox.south) / 2;
            const centerLon = (bbox.east + bbox.west) / 2;

            const map = L.map(mapRef.current, {
                center: [centerLat, centerLon],
                zoom: 13,
                scrollWheelZoom: false,
                attributionControl: false,
                zoomControl: !isFullScreen,
            });

            // Use a darker tile for better heatwave visibility
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19,
            }).addTo(map);

            leafletRef.current = L;
            mapInstanceRef.current = map;
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

    // Update polygon when data changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        const L = leafletRef.current;
        if (!map || !L || !ready) return;

        // Remove old polygon
        if (polygonRef.current) {
            map.removeLayer(polygonRef.current);
        }

        const polygonPositions: any[] = [
            [bbox.north, bbox.west],
            [bbox.north, bbox.east],
            [bbox.south, bbox.east],
            [bbox.south, bbox.west],
        ];

        const currentColor = RiskColors[riskLevel] || RiskColors.LOW;

        // Stronger fill opacity for visibility
        const fillOpacity = riskLevel === 'CRITICAL' ? 0.45
            : riskLevel === 'HIGH' ? 0.35
                : riskLevel === 'MEDIUM' ? 0.3
                    : 0.25;

        const polygon = L.polygon(polygonPositions, {
            color: currentColor.primary,
            fillColor: currentColor.primary,
            fillOpacity,
            weight: 3,
            dashArray: riskLevel === 'LOW' ? '6, 4' : undefined,
            className: `heatwave-polygon ${riskLevel === 'HIGH' || riskLevel === 'CRITICAL' ? 'heatwave-polygon-high' : ''}`,
        }).addTo(map);

        // Compact popup
        const prob = probability != null ? (probability * 100).toFixed(1) : '—';
        let popupHtml = `
            <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 180px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <span style="
                        background:${currentColor.primary};
                        color:#fff;
                        padding:3px 8px;
                        border-radius:4px;
                        font-weight:800;
                        font-size:11px;
                        letter-spacing:0.5px;
                    ">${riskLevel}</span>
                    <span style="font-weight:700;font-size:14px;">${prob}%</span>
                </div>
        `;
        if (weather) {
            popupHtml += `<div style="font-size:12px;color:#999;margin-bottom:6px;">
                🌡️ ${weather.T2M_MAX?.toFixed(1) ?? '—'}°C max · 💧 ${weather.RH2M?.toFixed(0) ?? '—'}%
            </div>`;
        }
        if (advice) {
            popupHtml += `<div style="font-size:11px;color:#aaa;border-top:1px solid #333;padding-top:6px;">${advice}</div>`;
        }
        popupHtml += '</div>';
        polygon.bindPopup(popupHtml, { maxWidth: 260, className: 'heatwave-popup' });
        polygonRef.current = polygon;

        // Fit bounds with padding
        map.fitBounds([
            [bbox.south, bbox.west],
            [bbox.north, bbox.east],
        ], { padding: [60, 60] });

    }, [bbox, riskLevel, probability, advice, weather, date, ready]);

    const containerStyle = isFullScreen ? [styles.containerFullScreen] : [styles.container];

    return (
        <View style={containerStyle}>
            {!ready && (
                <View style={styles.loader}>
                    <ActivityIndicator size="small" color={color.primary} />
                    <Text style={styles.loaderText}>Loading map…</Text>
                </View>
            )}
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 350,
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative' as any,
    },
    containerFullScreen: {
        position: 'absolute' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    loader: {
        position: 'absolute' as any,
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f0f1a',
        zIndex: 10,
    },
    loaderText: {
        marginTop: 8,
        fontSize: 12,
        color: '#6b7280',
    },
});

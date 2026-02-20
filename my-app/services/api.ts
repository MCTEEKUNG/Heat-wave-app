// ==============================
// Heat Wave — API Service
// Synced with NewHeart Flask API (localhost:5000)
// Auto-detects live backend, falls back to mock data
// ==============================

import type { HeatZone, HeatZoneCollection } from '@/types';

/** Flask API base URL — matches api_server.py in NewHeart */
const API_BASE_URL = 'http://localhost:5000';
const TIMEOUT_MS = 30000; // 30s for ConvLSTM inference

// ─── Data Transformation ─────────────────────────────────────────

/**
 * Map the Flask API's integer risk_level (0-3) to our severity strings.
 *   0 → low, 1 → medium, 2 → high, 3 → critical
 */
function riskIntToSeverity(risk: number): HeatZone['properties']['severity'] {
    if (risk >= 3) return 'critical';
    if (risk >= 2) return 'high';
    if (risk >= 1) return 'medium';
    return 'low';
}

/**
 * Map temperature to a probability value (0–1) for display.
 *   <30°C → 0.1–0.3     30-35°C → 0.3–0.5
 *   35-38°C → 0.5–0.7    38-41°C → 0.7–0.9    >41°C → 0.9–1.0
 */
function tempToProbability(temp: number): number {
    if (temp >= 41) return Math.min(1.0, 0.9 + (temp - 41) * 0.02);
    if (temp >= 38) return 0.7 + ((temp - 38) / 3) * 0.2;
    if (temp >= 35) return 0.5 + ((temp - 35) / 3) * 0.2;
    if (temp >= 30) return 0.3 + ((temp - 30) / 5) * 0.2;
    return Math.max(0.05, 0.1 + (temp / 30) * 0.2);
}

/**
 * Transform the Flask /api/map FeatureCollection into our HeatZone[] format.
 * The API returns individual grid cells — we pass them through directly,
 * adding the fields our UI expects (name, probability, severity, confidence).
 */
function transformApiFeatures(features: Array<{
    type: string;
    geometry: { type: string; coordinates: number[][][] };
    properties: { temperature: number; risk_level: number };
}>): HeatZone[] {
    return features.map((f, i) => {
        const temp = f.properties.temperature;
        const riskInt = f.properties.risk_level;
        const severity = riskIntToSeverity(riskInt);
        const probability = tempToProbability(temp);

        // Generate a name from the grid cell position
        const coords = f.geometry.coordinates[0];
        const centerLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
        const centerLon = coords.reduce((s, c) => s + c[0], 0) / coords.length;

        return {
            id: `grid-${i}`,
            type: 'Feature' as const,
            geometry: {
                type: 'Polygon' as const,
                coordinates: f.geometry.coordinates,
            },
            properties: {
                name: `Zone ${centerLat.toFixed(2)}°N, ${centerLon.toFixed(2)}°E`,
                probability,
                severity,
                temperature: temp,
                confidence: probability > 0.7 ? 0.9 : 0.75, // Higher confidence for extreme temps
                lastUpdate: new Date().toISOString(),
            },
        };
    });
}

// ─── Mock Heat Zones: Bangkok & Chiang Mai (OFFLINE fallback) ────

function generateMockZones(dayOffset: number = 0): HeatZone[] {
    const seed = dayOffset * 0.15;

    const zones: HeatZone[] = [
        // ── Bangkok Region ──
        {
            id: 'bkk-central',
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[[100.48, 13.72], [100.54, 13.72], [100.54, 13.78], [100.48, 13.78], [100.48, 13.72]]] },
            properties: { name: 'Bangkok Central', probability: Math.min(1, 0.85 + seed * 0.05), severity: 'critical', temperature: 42 + dayOffset * 0.3, confidence: 0.92, lastUpdate: new Date().toISOString() },
        },
        {
            id: 'bkk-north',
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[[100.46, 13.82], [100.56, 13.82], [100.56, 13.90], [100.46, 13.90], [100.46, 13.82]]] },
            properties: { name: 'Bangkok North (Don Mueang)', probability: Math.min(1, 0.65 + seed * 0.08), severity: 'high', temperature: 39 + dayOffset * 0.2, confidence: 0.87, lastUpdate: new Date().toISOString() },
        },
        {
            id: 'bkk-east',
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[[100.58, 13.70], [100.68, 13.70], [100.68, 13.80], [100.58, 13.80], [100.58, 13.70]]] },
            properties: { name: 'Bangkok East (Bangkapi)', probability: Math.min(1, 0.52 + seed * 0.06), severity: 'medium', temperature: 37 + dayOffset * 0.25, confidence: 0.81, lastUpdate: new Date().toISOString() },
        },
        {
            id: 'bkk-thonburi',
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[[100.38, 13.70], [100.47, 13.70], [100.47, 13.78], [100.38, 13.78], [100.38, 13.70]]] },
            properties: { name: 'Thonburi', probability: Math.min(1, 0.45 + seed * 0.04), severity: 'medium', temperature: 36 + dayOffset * 0.15, confidence: 0.79, lastUpdate: new Date().toISOString() },
        },
        {
            id: 'bkk-south',
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[[100.48, 13.60], [100.58, 13.60], [100.58, 13.70], [100.48, 13.70], [100.48, 13.60]]] },
            properties: { name: 'Bangkok South (Sathorn)', probability: Math.min(1, 0.30 + seed * 0.03), severity: 'low', temperature: 34 + dayOffset * 0.1, confidence: 0.85, lastUpdate: new Date().toISOString() },
        },
        // ── Chiang Mai Region ──
        {
            id: 'cm-city',
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[[98.94, 18.76], [99.02, 18.76], [99.02, 18.82], [98.94, 18.82], [98.94, 18.76]]] },
            properties: { name: 'Chiang Mai City', probability: Math.min(1, 0.72 + seed * 0.07), severity: 'high', temperature: 40 + dayOffset * 0.35, confidence: 0.88, lastUpdate: new Date().toISOString() },
        },
        {
            id: 'cm-north',
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[[98.92, 18.84], [99.04, 18.84], [99.04, 18.94], [98.92, 18.94], [98.92, 18.84]]] },
            properties: { name: 'Chiang Mai North (Mae Rim)', probability: Math.min(1, 0.38 + seed * 0.04), severity: 'low', temperature: 35 + dayOffset * 0.2, confidence: 0.76, lastUpdate: new Date().toISOString() },
        },
        {
            id: 'cm-south',
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[[98.90, 18.68], [99.00, 18.68], [99.00, 18.76], [98.90, 18.76], [98.90, 18.68]]] },
            properties: { name: 'Chiang Mai South (Hang Dong)', probability: Math.min(1, 0.55 + seed * 0.05), severity: 'medium', temperature: 38 + dayOffset * 0.15, confidence: 0.82, lastUpdate: new Date().toISOString() },
        },
    ];

    // Recalculate severity based on shifted probability
    return zones.map((z) => {
        const p = z.properties.probability;
        let severity: HeatZone['properties']['severity'] = 'low';
        if (p >= 0.8) severity = 'critical';
        else if (p >= 0.6) severity = 'high';
        else if (p >= 0.4) severity = 'medium';
        return { ...z, properties: { ...z.properties, severity } };
    });
}

// ─── API Client ──────────────────────────────────────────────────

let apiAvailable: boolean | null = null;

/** Check if the Flask API is reachable. Result is cached per session. */
async function checkApiAvailability(): Promise<boolean> {
    if (apiAvailable !== null) return apiAvailable;
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) {
            const data = await res.json();
            apiAvailable = data.status === 'ok' && data.model_loaded === true;
        } else {
            apiAvailable = false;
        }
    } catch {
        apiAvailable = false;
    }
    console.log(
        `[HeatWave API] Backend ${apiAvailable ? '✅ CONNECTED (ConvLSTM model loaded)' : '❌ OFFLINE (using mock data)'}`,
    );
    return apiAvailable;
}

async function fetchWithTimeout(url: string, timeoutMs = TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Fetch heat zones from the Flask /api/map endpoint.
 * Returns ConvLSTM-predicted temperature grid as GeoJSON polygons
 * transformed to our HeatZone format.
 * Falls back to mock data if the API is unavailable.
 */
export async function fetchHeatZones(
    date?: string,
    dayOffset: number = 0,
): Promise<{ zones: HeatZone[]; isLive: boolean }> {
    const isLive = await checkApiAvailability();

    if (!isLive) {
        await new Promise((r) => setTimeout(r, 300));
        return { zones: generateMockZones(dayOffset), isLive: false };
    }

    try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/api/map`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (data.error) throw new Error(data.error);

        // The API returns { type: "FeatureCollection", features: [...] }
        const rawFeatures = data.features || [];
        const zones = transformApiFeatures(rawFeatures);

        return { zones, isLive: true };
    } catch (err) {
        console.warn('[HeatWave API] fetchHeatZones failed, using mock:', err);
        return { zones: generateMockZones(dayOffset), isLive: false };
    }
}

/**
 * Fetch prediction summary from /api/predict.
 * Returns risk level, probability, weather, and bbox.
 */
export async function fetchPrediction(): Promise<{
    risk_level: string;
    probability: number;
    advice: string;
    weather: Record<string, number | null>;
    bbox: { north: number; south: number; east: number; west: number };
} | null> {
    const isLive = await checkApiAvailability();
    if (!isLive) return null;

    try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/api/predict`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (err) {
        console.warn('[HeatWave API] fetchPrediction failed:', err);
        return null;
    }
}

/**
 * Fetch 7-day forecast from /api/forecast.
 */
export async function fetchForecast(): Promise<{
    forecasts: Array<{
        day: number;
        date: string;
        risk_level: string;
        probability: number;
        weather: Record<string, number | null>;
    }>;
} | null> {
    const isLive = await checkApiAvailability();
    if (!isLive) return null;

    try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/api/forecast`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (err) {
        console.warn('[HeatWave API] fetchForecast failed:', err);
        return null;
    }
}

/** Reset the API availability cache. */
export function resetApiCache(): void {
    apiAvailable = null;
}

/** Check current API connection status. */
export function isApiConnected(): boolean {
    return apiAvailable === true;
}

// ==============================
// Heatwave AI — API Client Service
// Auto-detects live backend, falls back to mock data
// ==============================

import type { PredictionResponse, ForecastResponse, ForecastDay } from '@/types/heatwave';

// Use your machine's local IP if testing on device, or localhost for web
const API_BASE_URL = 'http://localhost:5000';
// const API_BASE_URL = 'http://192.168.1.101:5000'; // Example for physical device
const TIMEOUT_MS = 30000; // 30s — NASA POWER fetch can be slow

// ─── Mock Data ───────────────────────────────────────────────────

const MOCK_PREDICTION: PredictionResponse = {
    status: 'ok',
    date: new Date().toISOString().split('T')[0],
    probability: 0.42,
    risk_level: 'MEDIUM',
    advice: 'Moderate heatwave risk. Monitor conditions.',
    model_type: 'lstm',
    weather: {
        T2M: 31.2,
        T2M_MAX: 36.8,
        T2M_MIN: 26.4,
        PRECTOTCORR: 2.1,
        WS10M: 1.8,
        RH2M: 68.5,
        PS: 101.2,
        NDVI: 0.38,
        temp_range: 10.4,
        heat_index_approx: 34.7,
    },
    anomaly: {
        is_anomaly: false,
        severity: 'none',
        n_triggers: 0,
        triggers: [],
    },
    bbox: {
        north: 13.7788,
        south: 13.7338,
        east: 100.5243,
        west: 100.4793,
    },
};

function generateMockForecast(): ForecastResponse {
    const days: ForecastDay[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseDate = new Date();

    for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i + 1);
        const prob = Math.min(0.12 + 0.11 * i + Math.random() * 0.08, 1.0);
        const risk = prob < 0.4 ? 'LOW' : prob < 0.6 ? 'MEDIUM' : prob < 0.8 ? 'HIGH' : 'CRITICAL';

        days.push({
            day: i + 1,
            date: d.toISOString().split('T')[0],
            day_name: dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1],
            probability: Math.round(prob * 1000) / 1000,
            risk_level: `${risk}`,
            risk_label: risk as any,
            advice: '',
            weather: {
                T2M_MAX: 33 + i * 0.6 + Math.random() * 1.5,
                T2M_MIN: 24 + i * 0.3 + Math.random() * 0.8,
                T2M: 28 + i * 0.4 + Math.random(),
                PRECTOTCORR: Math.max(0, 5 - i * 0.8 + Math.random() * 2),
                WS10M: 1.5 + i * 0.2 + Math.random() * 0.5,
                RH2M: 75 - i * 2.5 + Math.random() * 3,
                NDVI: 0.35 + Math.random() * 0.1,
            },
        });
    }

    return {
        status: 'ok',
        model_type: 'lstm',
        days: 7,
        generated_at: new Date().toISOString(),
        forecasts: days,
    };
}

// ─── API Client ──────────────────────────────────────────────────

/** Force mock mode on/off. null = auto-detect (default) */
let forceMockMode: boolean | null = null;

/** Cached API availability status */
let apiAvailable: boolean | null = null;

export function setUseMockData(value: boolean) {
    forceMockMode = value;
    apiAvailable = value ? false : null; // reset detection when toggling to live
}

export function getUseMockData(): boolean {
    if (forceMockMode !== null) return forceMockMode;
    return apiAvailable === false;
}

/**
 * Check if the Flask API is reachable. Result is cached.
 */
async function checkApiAvailability(): Promise<boolean> {
    if (apiAvailable !== null) return apiAvailable;
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal });
        clearTimeout(timer);
        apiAvailable = res.ok;
    } catch {
        apiAvailable = false;
    }
    console.log(`[Heatwave API] Backend ${apiAvailable ? '✅ CONNECTED' : '❌ OFFLINE (using mock data)'}`);
    return apiAvailable;
}

async function fetchWithTimeout(url: string, timeoutMs = TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timer);
    }
}

// ─── Public API ──────────────────────────────────────────────────

export async function fetchPrediction(model?: string): Promise<PredictionResponse> {
    // Auto-detect backend availability
    const isLive = forceMockMode === true ? false : await checkApiAvailability();

    if (!isLive) {
        await new Promise((r) => setTimeout(r, 400));
        return { ...MOCK_PREDICTION, date: new Date().toISOString().split('T')[0] };
    }

    try {
        const params = model ? `?model=${model}` : '';
        const res = await fetchWithTimeout(`${API_BASE_URL}/api/predict${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.status === 'error') throw new Error(data.message);
        return data;
    } catch (err) {
        console.warn('[Heatwave API] Prediction failed, using mock:', err);
        return { ...MOCK_PREDICTION, date: new Date().toISOString().split('T')[0] };
    }
}

export async function fetchForecast(days = 7, model?: string): Promise<ForecastResponse> {
    const isLive = forceMockMode === true ? false : await checkApiAvailability();

    if (!isLive) {
        await new Promise((r) => setTimeout(r, 400));
        return generateMockForecast();
    }

    try {
        const params = new URLSearchParams({ days: String(days) });
        if (model) params.set('model', model);
        const res = await fetchWithTimeout(`${API_BASE_URL}/api/forecast?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.status === 'error') throw new Error(data.message);
        return data;
    } catch (err) {
        console.warn('[Heatwave API] Forecast failed, using mock:', err);
        return generateMockForecast();
    }
}

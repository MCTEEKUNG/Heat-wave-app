// ==============================
// Heat Wave — TypeScript Types
// ==============================

/** Risk severity levels */
export type Severity = 'low' | 'medium' | 'high' | 'critical';

/** Risk level display names (uppercase) */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** GeoJSON HeatZone feature */
export interface HeatZone {
    id: string;
    type: 'Feature';
    geometry: {
        type: 'Polygon';
        coordinates: number[][][]; // [[[lng, lat], ...]]
    };
    properties: {
        name: string;
        probability: number; // 0.0 to 1.0
        severity: Severity;
        temperature: number; // °C
        confidence: number; // 0.0 to 1.0
        lastUpdate: string; // ISO date string
    };
}

/** GeoJSON FeatureCollection of heat zones */
export interface HeatZoneCollection {
    type: 'FeatureCollection';
    features: HeatZone[];
}

/** Map viewport region */
export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

/** Risk level configuration */
export interface RiskLevelConfig {
    level: RiskLevel;
    severity: Severity;
    label: string;
    icon: string;
    color: string;
    opacity: number;
    minProbability: number;
    maxProbability: number;
    action: string;
    recommendations: string[];
}

/** TimeSlider item */
export interface TimeSliderItem {
    label: string; // "NOW", "+1D", "+2D", etc.
    dateNumber: number; // Day of month
    monthAbbr: string; // "Jan", "Feb", etc.
    fullDate: string; // YYYY-MM-DD
    isActive: boolean;
}

/** API prediction response (backward compat) */
export interface PredictionResponse {
    status: string;
    date: string;
    probability: number;
    risk_level: RiskLevel;
    advice: string;
    model_type: string;
    weather: WeatherData;
    anomaly: AnomalyInfo;
    bbox?: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
}

/** Weather data from API */
export interface WeatherData {
    T2M: number | null;
    T2M_MAX: number | null;
    T2M_MIN: number | null;
    PRECTOTCORR: number | null;
    WS10M: number | null;
    RH2M: number | null;
    PS: number | null;
    NDVI: number | null;
    temp_range?: number | null;
    heat_index_approx?: number | null;
}

/** Anomaly detection result */
export interface AnomalyInfo {
    is_anomaly: boolean;
    severity: 'none' | 'moderate' | 'high' | 'critical';
    n_triggers: number;
    triggers: AnomalyTrigger[];
}

export interface AnomalyTrigger {
    feature: string;
    type: string;
    z_score?: number;
    rate?: number;
    value?: number;
    mean?: number;
    detail: string;
}

/** Forecast day from API */
export interface ForecastDay {
    day: number;
    date: string;
    day_name: string;
    probability: number;
    risk_level: string;
    risk_label: RiskLevel;
    advice: string;
    weather: ForecastDayWeather;
}

export interface ForecastDayWeather {
    T2M_MAX: number | null;
    T2M_MIN: number | null;
    T2M: number | null;
    PRECTOTCORR: number | null;
    WS10M: number | null;
    RH2M: number | null;
    NDVI: number | null;
}

export interface ForecastResponse {
    status: string;
    model_type: string;
    days: number;
    generated_at: string;
    forecasts: ForecastDay[];
}

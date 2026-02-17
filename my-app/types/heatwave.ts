// ==============================
// Heatwave AI — TypeScript Types
// ==============================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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

export interface AnomalyTrigger {
    feature: string;
    type: string;
    z_score?: number;
    rate?: number;
    value?: number;
    mean?: number;
    detail: string;
}

export interface AnomalyInfo {
    is_anomaly: boolean;
    severity: 'none' | 'moderate' | 'high' | 'critical';
    n_triggers: number;
    triggers: AnomalyTrigger[];
}

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

export interface ForecastDayWeather {
    T2M_MAX: number | null;
    T2M_MIN: number | null;
    T2M: number | null;
    PRECTOTCORR: number | null;
    WS10M: number | null;
    RH2M: number | null;
    NDVI: number | null;
}

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

export interface ForecastResponse {
    status: string;
    model_type: string;
    days: number;
    generated_at: string;
    forecasts: ForecastDay[];
}

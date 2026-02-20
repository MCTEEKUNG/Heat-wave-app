// ==============================
// Heat Wave — Risk Level Configuration
// ==============================

import type { RiskLevelConfig, Severity, RiskLevel } from '@/types';

/**
 * Complete risk level configuration with colors, opacities, and actions.
 * Ordered from lowest to highest severity.
 */
export const RISK_LEVELS: RiskLevelConfig[] = [
    {
        level: 'LOW',
        severity: 'low',
        label: 'Low Risk',
        icon: '🟢',
        color: '#10B981',
        opacity: 0.25,
        minProbability: 0,
        maxProbability: 0.4,
        action: 'Normal conditions',
        recommendations: [
            'No special precautions needed',
            'Stay informed about weather updates',
            'Enjoy outdoor activities normally',
        ],
    },
    {
        level: 'MEDIUM',
        severity: 'medium',
        label: 'Medium Risk',
        icon: '🟡',
        color: '#F59E0B',
        opacity: 0.35,
        minProbability: 0.4,
        maxProbability: 0.6,
        action: 'Monitor conditions',
        recommendations: [
            'Drink plenty of water throughout the day',
            'Limit prolonged sun exposure',
            'Check on elderly and vulnerable people',
            'Plan outdoor activities for cooler hours',
        ],
    },
    {
        level: 'HIGH',
        severity: 'high',
        label: 'High Risk',
        icon: '🟠',
        color: '#F97316',
        opacity: 0.45,
        minProbability: 0.6,
        maxProbability: 0.8,
        action: 'Stay hydrated, avoid outdoors',
        recommendations: [
            'Avoid outdoor activity between 10 AM–4 PM',
            'Wear lightweight, light-colored clothing',
            'Use sunscreen SPF 50+ if going outside',
            'Keep rooms cool with fans or AC',
            'Watch for signs of heat exhaustion',
        ],
    },
    {
        level: 'CRITICAL',
        severity: 'critical',
        label: 'Critical Risk',
        icon: '🔴',
        color: '#EF4444',
        opacity: 0.55,
        minProbability: 0.8,
        maxProbability: 1.0,
        action: 'Take immediate precautions',
        recommendations: [
            'Stay indoors in air-conditioned spaces',
            'Cancel or postpone all outdoor activities',
            'Drink water every 15–20 minutes',
            'Never leave children or pets in vehicles',
            'Seek medical attention for heat-related symptoms',
            'Check on neighbors, especially elderly',
        ],
    },
];

/**
 * Get the risk level configuration for a given probability (0–1).
 */
export function getRiskLevel(probability: number): RiskLevelConfig {
    const clamped = Math.max(0, Math.min(1, probability));
    for (let i = RISK_LEVELS.length - 1; i >= 0; i--) {
        if (clamped >= RISK_LEVELS[i].minProbability) {
            return RISK_LEVELS[i];
        }
    }
    return RISK_LEVELS[0];
}

/**
 * Get the hex color for a given severity level.
 */
export function getRiskColor(severity: Severity): string {
    const config = RISK_LEVELS.find((r) => r.severity === severity);
    return config?.color ?? '#10B981';
}

/**
 * Get the fill opacity for a given severity level.
 */
export function getRiskOpacity(severity: Severity): number {
    const config = RISK_LEVELS.find((r) => r.severity === severity);
    return config?.opacity ?? 0.25;
}

/**
 * Get risk level display name from severity.
 */
export function getRiskLevelFromSeverity(severity: Severity): RiskLevel {
    const map: Record<Severity, RiskLevel> = {
        low: 'LOW',
        medium: 'MEDIUM',
        high: 'HIGH',
        critical: 'CRITICAL',
    };
    return map[severity];
}

/**
 * Get risk level config from severity.
 */
export function getRiskConfig(severity: Severity): RiskLevelConfig {
    return RISK_LEVELS.find((r) => r.severity === severity) ?? RISK_LEVELS[0];
}

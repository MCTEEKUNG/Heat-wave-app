// ==============================
// Heat Wave — Color Utilities
// ==============================

import type { Severity } from '@/types';

/**
 * Convert a hex color string to an rgba() CSS string.
 * @param hex - Hex color (e.g. "#EF4444")
 * @param opacity - Opacity value between 0 and 1
 */
export function hexToRgba(hex: string, opacity: number): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Determine severity from a probability value (0–1).
 */
export function getSeverityFromProbability(probability: number): Severity {
    if (probability >= 0.8) return 'critical';
    if (probability >= 0.6) return 'high';
    if (probability >= 0.4) return 'medium';
    return 'low';
}

/**
 * Darken a hex color by a percentage.
 * @param hex - Hex color string
 * @param percent - Amount to darken (0–100)
 */
export function darkenColor(hex: string, percent: number): string {
    const clean = hex.replace('#', '');
    const r = Math.max(0, parseInt(clean.substring(0, 2), 16) - Math.round(255 * (percent / 100)));
    const g = Math.max(0, parseInt(clean.substring(2, 4), 16) - Math.round(255 * (percent / 100)));
    const b = Math.max(0, parseInt(clean.substring(4, 6), 16) - Math.round(255 * (percent / 100)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

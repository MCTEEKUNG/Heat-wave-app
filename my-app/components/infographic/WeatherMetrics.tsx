/**
 * WeatherMetrics — 2×3 grid of metric cards
 * Each with icon, label, value, unit, and color coding
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import type { WeatherData } from '@/types/heatwave';

interface WeatherMetricsProps {
    weather: WeatherData;
}

interface MetricConfig {
    key: keyof WeatherData;
    icon: string;
    label: string;
    unit: string;
    decimals: number;
    color: string;
    warnThreshold?: { above?: number; below?: number };
}

const METRICS: MetricConfig[] = [
    {
        key: 'T2M_MAX',
        icon: '🌡️',
        label: 'Max Temp',
        unit: '°C',
        decimals: 1,
        color: '#EF4444',
        warnThreshold: { above: 38 },
    },
    {
        key: 'T2M_MIN',
        icon: '❄️',
        label: 'Min Temp',
        unit: '°C',
        decimals: 1,
        color: '#3B82F6',
    },
    {
        key: 'RH2M',
        icon: '💦',
        label: 'Humidity',
        unit: '%',
        decimals: 1,
        color: '#8B5CF6',
        warnThreshold: { below: 30 },
    },
    {
        key: 'WS10M',
        icon: '💨',
        label: 'Wind Speed',
        unit: 'm/s',
        decimals: 1,
        color: '#06B6D4',
        warnThreshold: { above: 5 },
    },
    {
        key: 'PRECTOTCORR',
        icon: '🌧️',
        label: 'Rainfall',
        unit: 'mm',
        decimals: 1,
        color: '#2563EB',
    },
    {
        key: 'NDVI',
        icon: '🌿',
        label: 'Vegetation',
        unit: '',
        decimals: 4,
        color: '#16A34A',
        warnThreshold: { below: 0.2 },
    },
];

export function WeatherMetrics({ weather }: WeatherMetricsProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <View style={styles.grid}>
            {METRICS.map((metric) => {
                const val = weather[metric.key];
                const numVal = typeof val === 'number' ? val : null;
                const displayVal = numVal !== null ? numVal.toFixed(metric.decimals) : '—';

                const isWarn =
                    numVal !== null &&
                    metric.warnThreshold &&
                    ((metric.warnThreshold.above && numVal > metric.warnThreshold.above) ||
                        (metric.warnThreshold.below && numVal < metric.warnThreshold.below));

                return (
                    <View
                        key={metric.key}
                        style={[
                            styles.card,
                            {
                                backgroundColor: theme.cardBg,
                                borderColor: isWarn ? metric.color : theme.border,
                                borderWidth: isWarn ? 1.5 : 1,
                            },
                        ]}
                    >
                        <Text style={styles.icon}>{metric.icon}</Text>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>{metric.label}</Text>
                        <View style={styles.valueRow}>
                            <Text style={[styles.value, { color: isWarn ? metric.color : theme.text }]}>
                                {displayVal}
                            </Text>
                            <Text style={[styles.unit, { color: theme.textSecondary }]}>{metric.unit}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    card: {
        width: '30%',
        minWidth: 100,
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
        gap: 4,
    },
    icon: {
        fontSize: 22,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    value: {
        fontSize: 22,
        fontWeight: '800',
    },
    unit: {
        fontSize: 12,
        fontWeight: '500',
    },
});

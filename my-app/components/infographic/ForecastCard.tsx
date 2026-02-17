/**
 * ForecastCard — Individual day forecast card
 * Shows day name, date, risk badge, probability, and weather mini-details
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, RiskColors } from '@/constants/theme';
import { RiskBadge } from './RiskBadge';
import type { ForecastDay } from '@/types/heatwave';

interface ForecastCardProps {
    forecast: ForecastDay;
    isToday?: boolean;
}

export function ForecastCard({ forecast, isToday = false }: ForecastCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const riskColor = RiskColors[forecast.risk_label] || RiskColors.LOW;

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: theme.cardBg,
                    borderColor: isToday ? riskColor.primary : theme.border,
                    borderWidth: isToday ? 2 : 1,
                },
            ]}
        >
            {/* Header row: day + risk */}
            <View style={styles.headerRow}>
                <View>
                    <Text style={[styles.dayName, { color: theme.text }]}>
                        {forecast.day_name}
                    </Text>
                    <Text style={[styles.date, { color: theme.textSecondary }]}>
                        {forecast.date}
                    </Text>
                </View>
                <RiskBadge riskLevel={forecast.risk_label} compact />
            </View>

            {/* Probability */}
            <View style={styles.probRow}>
                <View style={styles.probBarBg}>
                    <View
                        style={[
                            styles.probBarFill,
                            {
                                width: `${Math.min(forecast.probability * 100, 100)}%`,
                                backgroundColor: riskColor.primary,
                            },
                        ]}
                    />
                </View>
                <Text style={[styles.probText, { color: riskColor.primary }]}>
                    {(forecast.probability * 100).toFixed(0)}%
                </Text>
            </View>

            {/* Weather mini-details */}
            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>🌡️</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                        {forecast.weather.T2M_MAX?.toFixed(0) ?? '—'}°
                    </Text>
                    <Text style={[styles.detailSub, { color: '#3B82F6' }]}>
                        {forecast.weather.T2M_MIN?.toFixed(0) ?? '—'}°
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>🌧️</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                        {forecast.weather.PRECTOTCORR?.toFixed(1) ?? '—'}
                    </Text>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>mm</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>💨</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                        {forecast.weather.WS10M?.toFixed(1) ?? '—'}
                    </Text>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>m/s</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>💦</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                        {forecast.weather.RH2M?.toFixed(0) ?? '—'}
                    </Text>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>%</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        gap: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dayName: {
        fontSize: 17,
        fontWeight: '700',
    },
    date: {
        fontSize: 12,
        marginTop: 1,
    },
    probRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    probBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: '#E7E5E4',
        borderRadius: 4,
        overflow: 'hidden',
    },
    probBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    probText: {
        fontSize: 15,
        fontWeight: '800',
        width: 40,
        textAlign: 'right',
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    detailItem: {
        alignItems: 'center',
        gap: 2,
    },
    detailIcon: {
        fontSize: 16,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    detailSub: {
        fontSize: 12,
        fontWeight: '600',
    },
    detailLabel: {
        fontSize: 10,
    },
});

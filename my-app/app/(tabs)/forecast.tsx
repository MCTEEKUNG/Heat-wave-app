/**
 * Forecast Screen — 7-Day Heatwave Forecast Infographic
 * Probability bars, temperature trend chart, forecast day cards
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { fetchForecast } from '@/services/api';
import { ProbabilityBars } from '@/components/infographic/ProbabilityBars';
import { TemperatureTrend } from '@/components/infographic/TemperatureTrend';
import { ForecastCard } from '@/components/infographic/ForecastCard';
import type { ForecastResponse } from '@/types/heatwave';

export default function ForecastScreen() {
    const [data, setData] = useState<ForecastResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { width } = useWindowDimensions();

    const load = useCallback(async () => {
        try {
            const result = await fetchForecast(7);
            setData(result);
        } catch (e) {
            console.error('Failed to load forecast:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        load();
    }, [load]);

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.tint} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                    Generating forecast...
                </Text>
            </View>
        );
    }

    if (!data || data.forecasts.length === 0) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <Text style={[styles.errorText, { color: theme.text }]}>
                    No forecast data available. Pull to refresh.
                </Text>
            </View>
        );
    }

    const chartWidth = Math.min(width - 32, 600);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
            }
        >
            {/* Minimal Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>7-Day Forecast</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Next 7 days · {data.model_type.toUpperCase()} Model
                </Text>
            </View>

            {/* Probability Bars - Clean Card */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Heatwave Probability</Text>
                <ProbabilityBars forecasts={data.forecasts} />
            </View>

            {/* Temperature Trend - Clean Card */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={styles.trendHeader}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Temperature Prediction</Text>
                    <View style={styles.legendRow}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                            <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>Max</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                            <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>Min</Text>
                        </View>
                    </View>
                </View>
                {/* Add subtle top padding for chart */}
                <View style={{ paddingTop: 16 }}>
                    <TemperatureTrend forecasts={data.forecasts} width={chartWidth - 32} height={220} />
                </View>
            </View>

            {/* Daily Forecast List - Spaced out */}
            <View style={styles.section}>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>Daily Outlook</Text>
                <View style={styles.forecastList}>
                    {data.forecasts.map((f, i) => (
                        <ForecastCard key={f.date} forecast={f} isToday={i === 0} />
                    ))}
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                    Generated {data.generated_at?.split('T')[0]} · NASA POWER Data
                </Text>
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 60,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    errorText: {
        fontSize: 16,
        fontWeight: '500',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 68,
        paddingBottom: 24,
    },
    title: {
        fontSize: 32, // Large and bold
        fontWeight: '800',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '500',
        marginTop: 4,
    },
    card: {
        marginHorizontal: 24,
        marginBottom: 24,
        padding: 24, // Generous padding
        borderRadius: 24,
        // Soft Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)', // Ultra subtle border
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    trendHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    legendRow: {
        flexDirection: 'row',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    section: {
        paddingHorizontal: 24,
        marginTop: 8,
    },
    sectionHeading: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        letterSpacing: -0.5,
    },
    forecastList: {
        gap: 16, // Space between cards
    },
    footer: {
        alignItems: 'center',
        marginTop: 40,
        paddingHorizontal: 24,
    },
    footerText: {
        fontSize: 12,
        textAlign: 'center',
    },
});

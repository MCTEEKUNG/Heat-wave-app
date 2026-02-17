/**
 * ProbabilityBars — Vertical bar chart for 7-day probabilities
 * Color-coded by risk level with risk zone background bands
 * Animated bar growth
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, RiskColors } from '@/constants/theme';
import type { ForecastDay } from '@/types/heatwave';

interface ProbabilityBarsProps {
    forecasts: ForecastDay[];
}

const BAR_HEIGHT = 160;

function AnimatedBar({
    probability,
    riskLabel,
    dayName,
    date,
    index,
}: {
    probability: number;
    riskLabel: string;
    dayName: string;
    date: string;
    index: number;
}) {
    const height = useSharedValue(0);
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const color = RiskColors[riskLabel as keyof typeof RiskColors] || RiskColors.LOW;

    useEffect(() => {
        height.value = withDelay(
            index * 100,
            withTiming(probability * BAR_HEIGHT, { duration: 800, easing: Easing.out(Easing.cubic) })
        );
    }, [probability]);

    const animatedBarStyle = useAnimatedStyle(() => ({
        height: height.value,
    }));

    return (
        <View style={styles.barColumn}>
            <Text style={[styles.pctLabel, { color: color.primary }]}>
                {(probability * 100).toFixed(0)}%
            </Text>
            <View style={[styles.barTrack, { backgroundColor: colorScheme === 'dark' ? '#292220' : '#F5F0EB' }]}>
                <Animated.View
                    style={[
                        styles.barFill,
                        { backgroundColor: color.primary },
                        animatedBarStyle,
                    ]}
                />
            </View>
            <Text style={[styles.dayLabel, { color: theme.text }]}>{dayName}</Text>
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>
                {date.slice(5)}
            </Text>
        </View>
    );
}

export function ProbabilityBars({ forecasts }: ProbabilityBarsProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <View style={styles.container}>
            {/* Risk zone labels */}
            <View style={styles.zoneLabels}>
                <Text style={[styles.zoneText, { color: '#EF4444' }]}>CRITICAL</Text>
                <Text style={[styles.zoneText, { color: '#F97316' }]}>HIGH</Text>
                <Text style={[styles.zoneText, { color: '#F59E0B' }]}>MEDIUM</Text>
                <Text style={[styles.zoneText, { color: '#22C55E' }]}>LOW</Text>
            </View>

            {/* Bars */}
            <View style={styles.barsContainer}>
                {/* Risk zone background bands */}
                <View style={[styles.zoneBand, styles.zoneCritical]} />
                <View style={[styles.zoneBand, styles.zoneHigh]} />
                <View style={[styles.zoneBand, styles.zoneMedium]} />
                <View style={[styles.zoneBand, styles.zoneLow]} />

                <View style={styles.barsRow}>
                    {forecasts.map((f, i) => (
                        <AnimatedBar
                            key={f.date}
                            probability={f.probability}
                            riskLabel={f.risk_label}
                            dayName={f.day_name}
                            date={f.date}
                            index={i}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 6,
    },
    zoneLabels: {
        justifyContent: 'space-between',
        paddingBottom: 38,
        width: 56,
    },
    zoneText: {
        fontSize: 8,
        fontWeight: '700',
        textAlign: 'right',
        letterSpacing: 0.3,
    },
    barsContainer: {
        flex: 1,
        height: BAR_HEIGHT + 40,
        position: 'relative',
    },
    barsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: BAR_HEIGHT,
        zIndex: 2,
    },
    barColumn: {
        alignItems: 'center',
        flex: 1,
    },
    pctLabel: {
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 3,
    },
    barTrack: {
        width: 22,
        height: BAR_HEIGHT,
        borderRadius: 6,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    barFill: {
        width: '100%',
        borderRadius: 6,
    },
    dayLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 5,
    },
    dateLabel: {
        fontSize: 9,
    },
    zoneBand: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 0,
        borderRadius: 4,
    },
    zoneCritical: {
        top: 0,
        height: BAR_HEIGHT * 0.2,
        backgroundColor: 'rgba(239,68,68,0.06)',
    },
    zoneHigh: {
        top: BAR_HEIGHT * 0.2,
        height: BAR_HEIGHT * 0.2,
        backgroundColor: 'rgba(249,115,22,0.06)',
    },
    zoneMedium: {
        top: BAR_HEIGHT * 0.4,
        height: BAR_HEIGHT * 0.2,
        backgroundColor: 'rgba(245,158,11,0.06)',
    },
    zoneLow: {
        top: BAR_HEIGHT * 0.6,
        height: BAR_HEIGHT * 0.4,
        backgroundColor: 'rgba(34,197,94,0.06)',
    },
});

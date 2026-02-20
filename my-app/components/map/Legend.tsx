/**
 * Legend — Risk level legend with coverage statistics
 * Shows all 4 risk levels, percentage coverage, and LIVE indicator.
 */
import React, { useMemo, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Platform,
} from 'react-native';
import { RISK_LEVELS } from '@/constants/RiskLevels';
import type { HeatZone } from '@/types';

interface LegendProps {
    zones: HeatZone[];
    isLive: boolean;
}

function LegendInner({ zones, isLive }: LegendProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulsing animation for LIVE dot
    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ]),
        );
        animation.start();
        return () => animation.stop();
    }, [pulseAnim]);

    /** Calculate percentage coverage per risk level */
    const coverage = useMemo(() => {
        if (zones.length === 0) {
            return { low: 0, medium: 0, high: 0, critical: 0 };
        }

        const counts = { low: 0, medium: 0, high: 0, critical: 0 };
        zones.forEach((z) => {
            const sev = z.properties.severity;
            if (sev in counts) counts[sev]++;
        });

        const total = zones.length;
        return {
            low: Math.round((counts.low / total) * 100),
            medium: Math.round((counts.medium / total) * 100),
            high: Math.round((counts.high / total) * 100),
            critical: Math.round((counts.critical / total) * 100),
        };
    }, [zones]);

    return (
        <View style={styles.container}>
            {/* LIVE / MOCK indicator */}
            <View style={styles.liveRow}>
                <Animated.View
                    style={[
                        styles.liveDot,
                        {
                            backgroundColor: isLive ? '#10B981' : '#F59E0B',
                            opacity: pulseAnim,
                        },
                    ]}
                />
                <Text style={[styles.liveText, { color: isLive ? '#6EE7B7' : '#FCD34D' }]}>
                    {isLive ? 'LIVE' : 'MOCK'}
                </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Risk levels */}
            {RISK_LEVELS.map((level) => {
                const pct = coverage[level.severity];
                return (
                    <View key={level.level} style={styles.levelRow}>
                        <View style={[styles.colorBox, { backgroundColor: level.color }]} />
                        <Text style={styles.levelIcon}>{level.icon}</Text>
                        <Text style={styles.levelLabel}>{level.level}</Text>
                        <Text style={styles.levelPct}>{pct}%</Text>
                    </View>
                );
            })}
        </View>
    );
}

const Legend = React.memo(LegendInner);
export default Legend;

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        minWidth: 140,
        ...({
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
        } as Record<string, string>),
    },
    liveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    liveText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        marginVertical: 8,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 3,
    },
    colorBox: {
        width: 12,
        height: 12,
        borderRadius: 3,
    },
    levelIcon: {
        fontSize: 10,
    },
    levelLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.6)',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        flex: 1,
    },
    levelPct: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.8)',
        minWidth: 30,
        textAlign: 'right',
    },
});

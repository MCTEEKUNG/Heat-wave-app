/**
 * AnomalyAlert — Alert banner when weather anomalies are detected
 * Severity-based coloring with trigger details
 * Slide-in animation
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    Easing,
} from 'react-native-reanimated';
import type { AnomalyInfo } from '@/types/heatwave';

interface AnomalyAlertProps {
    anomaly: AnomalyInfo;
}

import { RiskColors } from '@/constants/theme';

const SEVERITY_STYLES = {
    moderate: { bg: RiskColors.MEDIUM.light, border: RiskColors.MEDIUM.primary, icon: '⚠️', text: RiskColors.MEDIUM.dark },
    high: { bg: RiskColors.HIGH.light, border: RiskColors.HIGH.primary, icon: '🔶', text: RiskColors.HIGH.dark },
    critical: { bg: RiskColors.CRITICAL.light, border: RiskColors.CRITICAL.primary, icon: '🚨', text: RiskColors.CRITICAL.dark },
    none: { bg: RiskColors.LOW.light, border: RiskColors.LOW.primary, icon: '✅', text: RiskColors.LOW.dark },
};

export function AnomalyAlert({ anomaly }: AnomalyAlertProps) {
    const translateY = useSharedValue(-60);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (anomaly.is_anomaly) {
            translateY.value = withSpring(0, { damping: 12, stiffness: 100 });
            opacity.value = withTiming(1, { duration: 400 });
        } else {
            translateY.value = -60;
            opacity.value = 0;
        }
    }, [anomaly.is_anomaly]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    if (!anomaly.is_anomaly) return null;

    const sev = SEVERITY_STYLES[anomaly.severity] || SEVERITY_STYLES.moderate;

    return (
        <Animated.View style={[styles.container, { backgroundColor: sev.bg, borderColor: sev.border }, animatedStyle]}>
            <View style={styles.header}>
                <Text style={styles.icon}>{sev.icon}</Text>
                <Text style={[styles.title, { color: sev.text }]}>
                    Anomaly Detected — {anomaly.severity.toUpperCase()}
                </Text>
            </View>
            {anomaly.triggers.length > 0 && (
                <View style={styles.triggersContainer}>
                    {anomaly.triggers.map((t, i) => (
                        <Text key={i} style={[styles.trigger, { color: sev.text }]}>
                            • {t.detail}
                        </Text>
                    ))}
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 14,
        borderWidth: 1.5,
        padding: 14,
        marginBottom: 6,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    icon: {
        fontSize: 20,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
    },
    triggersContainer: {
        marginTop: 8,
        gap: 4,
    },
    trigger: {
        fontSize: 12,
        lineHeight: 18,
        opacity: 0.9,
    },
});

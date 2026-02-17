/**
 * RiskBadge — Pill-shaped badge showing risk level
 * Color-coded background with icon + label text
 * Pulsing animation for HIGH/CRITICAL levels
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { RiskColors, RiskIcons } from '@/constants/theme';
import type { RiskLevel } from '@/types/heatwave';

interface RiskBadgeProps {
    riskLevel: RiskLevel;
    advice?: string;
    compact?: boolean;
}

export function RiskBadge({ riskLevel, advice, compact = false }: RiskBadgeProps) {
    const scale = useSharedValue(1);
    const color = RiskColors[riskLevel] || RiskColors.LOW;
    const icon = RiskIcons[riskLevel] || '⚪';
    const shouldPulse = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

    useEffect(() => {
        if (shouldPulse) {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.04, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1.0, { duration: 800, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        } else {
            scale.value = withTiming(1, { duration: 300 });
        }
    }, [shouldPulse]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    if (compact) {
        return (
            <Animated.View
                style={[
                    styles.badgeCompact,
                    { backgroundColor: color.light },
                    animatedStyle,
                ]}
            >
                <Text style={styles.icon}>{icon}</Text>
                <Text style={[styles.labelCompact, { color: color.dark }]}>{riskLevel}</Text>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <View style={[styles.badge, { backgroundColor: color.light, borderColor: color.primary }]}>
                <Text style={styles.iconLarge}>{icon}</Text>
                <View style={styles.textContainer}>
                    <Text style={[styles.label, { color: color.dark }]}>{riskLevel} RISK</Text>
                    {advice ? <Text style={[styles.advice, { color: color.dark }]}>{advice}</Text> : null}
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1.5,
        gap: 12,
        maxWidth: 400,
        width: '100%',
    },
    badgeCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    icon: {
        fontSize: 14,
    },
    iconLarge: {
        fontSize: 28,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    labelCompact: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    advice: {
        fontSize: 13,
        marginTop: 2,
        opacity: 0.85,
    },
});

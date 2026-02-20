/**
 * AlertCard — Bottom sheet with zone details
 * Appears when user taps a heat zone on the map.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Animated,
    useWindowDimensions,
    Platform,
} from 'react-native';
import { getRiskConfig } from '@/constants/RiskLevels';
import type { HeatZone } from '@/types';

interface AlertCardProps {
    zone: HeatZone | null;
    onClose: () => void;
}

function AlertCardInner({ zone, onClose }: AlertCardProps) {
    const slideAnim = useRef(new Animated.Value(400)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { width: screenWidth } = useWindowDimensions();

    // Responsive card width
    const isDesktop = screenWidth >= 1024;
    const isTablet = screenWidth >= 768;
    const cardWidth = isDesktop ? 400 : isTablet ? 360 : screenWidth - 24;

    // Animate in/out
    useEffect(() => {
        if (zone) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 400,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [zone, slideAnim, fadeAnim]);

    const handleClose = useCallback(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 400,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    }, [slideAnim, fadeAnim, onClose]);

    if (!zone) return null;

    const config = getRiskConfig(zone.properties.severity);
    const prob = (zone.properties.probability * 100).toFixed(1);
    const confidence = (zone.properties.confidence * 100).toFixed(0);

    return (
        <Animated.View
            style={[
                styles.overlay,
                {
                    opacity: fadeAnim,
                    pointerEvents: zone ? 'auto' : 'none',
                },
            ]}
        >
            {/* Backdrop */}
            <Pressable style={styles.backdrop} onPress={handleClose} />

            {/* Card */}
            <Animated.View
                style={[
                    styles.card,
                    {
                        width: cardWidth,
                        transform: [{ translateY: slideAnim }],
                    },
                    isDesktop && styles.cardDesktop,
                ]}
            >
                {/* Drag handle */}
                <View style={styles.handleBar}>
                    <View style={styles.handle} />
                </View>

                {/* Close button */}
                <Pressable
                    style={styles.closeBtn}
                    onPress={handleClose}
                    accessibilityLabel="Close alert details"
                    accessibilityRole="button"
                >
                    <Text style={styles.closeBtnText}>✕</Text>
                </Pressable>

                <ScrollView
                    style={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* Header: Icon + Zone Name */}
                    <View style={styles.header}>
                        <Text style={styles.headerIcon}>{config.icon}</Text>
                        <View style={styles.headerText}>
                            <Text style={styles.zoneName}>{zone.properties.name}</Text>
                            <View style={[styles.riskBadge, { backgroundColor: config.color }]}>
                                <Text style={styles.riskBadgeText}>{config.level}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Metrics grid */}
                    <View style={styles.metricsGrid}>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>PROBABILITY</Text>
                            <Text style={[styles.metricValue, { color: config.color }]}>{prob}%</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>TEMPERATURE</Text>
                            <Text style={styles.metricValue}>{zone.properties.temperature.toFixed(1)}°C</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>CONFIDENCE</Text>
                            <Text style={styles.metricValue}>{confidence}%</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>SEVERITY</Text>
                            <Text style={[styles.metricValue, { color: config.color, fontSize: 14 }]}>
                                {config.label}
                            </Text>
                        </View>
                    </View>

                    {/* Action required */}
                    <View style={[styles.actionSection, { borderLeftColor: config.color }]}>
                        <Text style={styles.actionTitle}>⚠️ Action Required</Text>
                        <Text style={styles.actionText}>{config.action}</Text>
                    </View>

                    {/* Recommendations */}
                    <View style={styles.recommendSection}>
                        <Text style={styles.recommendTitle}>📋 Recommendations</Text>
                        {config.recommendations.map((rec, i) => (
                            <View key={i} style={styles.recommendItem}>
                                <Text style={styles.recommendBullet}>•</Text>
                                <Text style={styles.recommendText}>{rec}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Last update */}
                    <Text style={styles.lastUpdate}>
                        Last updated: {new Date(zone.properties.lastUpdate).toLocaleString()}
                    </Text>
                </ScrollView>
            </Animated.View>
        </Animated.View>
    );
}

const AlertCard = React.memo(AlertCardInner);
export default AlertCard;

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 200,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    card: {
        backgroundColor: '#1F2937',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        ...({
            boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.5)',
        } as Record<string, string>),
    },
    cardDesktop: {
        borderRadius: 24,
        marginBottom: 24,
        maxHeight: '70%',
    },
    handleBar: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 4,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    closeBtnText: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 8,
        marginBottom: 20,
    },
    headerIcon: {
        fontSize: 32,
    },
    headerText: {
        flex: 1,
    },
    zoneName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    riskBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
    },
    riskBadgeText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },

    // Metrics
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    metricCard: {
        flex: 1,
        minWidth: 120,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
        padding: 14,
    },
    metricLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    metricValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -0.5,
    },

    // Action
    actionSection: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderLeftWidth: 3,
        borderRadius: 10,
        padding: 14,
        marginBottom: 16,
    },
    actionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 6,
    },
    actionText: {
        fontSize: 13,
        color: '#d1d5db',
        lineHeight: 20,
    },

    // Recommendations
    recommendSection: {
        marginBottom: 20,
    },
    recommendTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 10,
    },
    recommendItem: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 6,
    },
    recommendBullet: {
        color: '#6b7280',
        fontSize: 14,
        lineHeight: 20,
    },
    recommendText: {
        flex: 1,
        fontSize: 13,
        color: '#d1d5db',
        lineHeight: 20,
    },

    // Footer
    lastUpdate: {
        fontSize: 10,
        color: '#4b5563',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 16,
    },
});

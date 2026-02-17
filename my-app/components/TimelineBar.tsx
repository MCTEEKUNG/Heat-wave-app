/**
 * TimelineBar — Minimal horizontal day selector
 * Compact, slim design that doesn't steal focus from the map.
 */
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    useWindowDimensions,
} from 'react-native';
import { RiskColors } from '@/constants/theme';
import type { RiskLevel } from '@/types/heatwave';

export interface TimelineDay {
    label: string;
    date: string;
    riskLevel: RiskLevel;
    hasData: boolean;
}

interface TimelineBarProps {
    days: TimelineDay[];
    selectedIndex: number;
    onSelectDay: (index: number) => void;
}

export function TimelineBar({ days, selectedIndex, onSelectDay }: TimelineBarProps) {
    const scrollRef = useRef<ScrollView>(null);
    const { width: screenWidth } = useWindowDimensions();

    const pillWidth = Math.max(52, Math.min(screenWidth / 6.5, 64));

    useEffect(() => {
        if (scrollRef.current) {
            const scrollX = Math.max(0, selectedIndex * (pillWidth + 6) - screenWidth / 2 + pillWidth / 2);
            scrollRef.current.scrollTo({ x: scrollX, animated: true });
        }
    }, [selectedIndex, pillWidth, screenWidth]);

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={pillWidth + 6}
            >
                {days.map((day, index) => {
                    const isActive = index === selectedIndex;
                    const color = RiskColors[day.riskLevel] || RiskColors.LOW;
                    const dateObj = new Date(day.date + 'T00:00:00');
                    const dateNum = dateObj.getDate();

                    return (
                        <Pressable
                            key={index}
                            onPress={() => onSelectDay(index)}
                            style={({ pressed }) => [
                                styles.pill,
                                { width: pillWidth },
                                isActive && {
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    borderColor: color.primary,
                                },
                                !isActive && {
                                    borderColor: 'transparent',
                                },
                                pressed && { opacity: 0.6 },
                            ]}
                        >
                            <Text style={[
                                styles.dayLabel,
                                isActive && { color: '#fff', fontWeight: '700' },
                            ]}>
                                {day.label}
                            </Text>
                            <Text style={[
                                styles.dateNum,
                                isActive && { color: '#fff', fontWeight: '800' },
                            ]}>
                                {dateNum}
                            </Text>
                            {/* Risk dot */}
                            <View style={[
                                styles.riskDot,
                                {
                                    backgroundColor: day.hasData ? color.primary : 'rgba(255,255,255,0.15)',
                                    ...(isActive ? { width: 16, borderRadius: 2, height: 3 } : {}),
                                },
                            ]} />
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 12,
        borderRadius: 14,
        backgroundColor: 'rgba(15, 15, 26, 0.6)',
        paddingVertical: 6,
        paddingHorizontal: 2,
        ...({
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
        } as any),
    },
    scrollContent: {
        paddingHorizontal: 4,
        gap: 6,
        alignItems: 'center',
    },
    pill: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1.5,
        gap: 1,
        minHeight: 52,
    },
    dayLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateNum: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 20,
    },
    riskDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        marginTop: 1,
    },
});

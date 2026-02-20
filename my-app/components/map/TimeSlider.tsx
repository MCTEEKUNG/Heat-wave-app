/**
 * TimeSlider — Horizontal scrollable timeline selector
 * Shows "NOW", "+1D", "+2D", up to "+7D" with date info.
 */
import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    useWindowDimensions,
    Platform,
} from 'react-native';
import type { TimeSliderItem } from '@/types';

interface TimeSliderProps {
    selectedDay: number;
    onSelectDay: (index: number) => void;
}

const MONTH_ABBRS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function TimeSliderInner({ selectedDay, onSelectDay }: TimeSliderProps) {
    const scrollRef = useRef<ScrollView>(null);
    const { width: screenWidth } = useWindowDimensions();

    // Calculate adaptive pill width
    const pillWidth = Math.max(56, Math.min(screenWidth / 7, 72));
    const pillGap = 8;

    /** Build timeline items from NOW to +7D */
    const items: TimeSliderItem[] = useMemo(() => {
        const result: TimeSliderItem[] = [];
        const today = new Date();

        for (let i = 0; i <= 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);

            result.push({
                label: i === 0 ? 'NOW' : `+${i}D`,
                dateNumber: d.getDate(),
                monthAbbr: MONTH_ABBRS[d.getMonth()],
                fullDate: d.toISOString().split('T')[0],
                isActive: i === selectedDay,
            });
        }
        return result;
    }, [selectedDay]);

    // Auto-scroll to selected pill
    useEffect(() => {
        if (scrollRef.current) {
            const scrollX = Math.max(
                0,
                selectedDay * (pillWidth + pillGap) - screenWidth / 2 + pillWidth / 2,
            );
            scrollRef.current.scrollTo({ x: scrollX, animated: true });
        }
    }, [selectedDay, pillWidth, screenWidth]);

    const handlePress = useCallback(
        (index: number) => {
            onSelectDay(index);
        },
        [onSelectDay],
    );

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={pillWidth + pillGap}
            >
                {items.map((item, index) => {
                    const isActive = index === selectedDay;

                    return (
                        <Pressable
                            key={index}
                            onPress={() => handlePress(index)}
                            style={({ pressed }) => [
                                styles.pill,
                                { width: pillWidth },
                                isActive && styles.pillActive,
                                !isActive && styles.pillInactive,
                                pressed && { opacity: 0.6 },
                            ]}
                            accessibilityLabel={`${item.label}, ${item.monthAbbr} ${item.dateNumber}`}
                            accessibilityRole="button"
                        >
                            {/* Label */}
                            <Text
                                style={[
                                    styles.pillLabel,
                                    isActive && styles.pillLabelActive,
                                ]}
                            >
                                {item.label}
                            </Text>

                            {/* Date number */}
                            <Text
                                style={[
                                    styles.pillDate,
                                    isActive && styles.pillDateActive,
                                ]}
                            >
                                {item.dateNumber}
                            </Text>

                            {/* Month abbreviation */}
                            <Text
                                style={[
                                    styles.pillMonth,
                                    isActive && styles.pillMonthActive,
                                ]}
                            >
                                {item.monthAbbr}
                            </Text>

                            {/* Active indicator bar */}
                            {isActive && <View style={styles.activeBar} />}
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const TimeSlider = React.memo(TimeSliderInner);
export default TimeSlider;

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingVertical: 8,
        paddingHorizontal: 4,
        ...({
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
        } as Record<string, string>),
    },
    scrollContent: {
        paddingHorizontal: 8,
        gap: 8,
        alignItems: 'center',
    },
    pill: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1.5,
        gap: 2,
        minHeight: 64,
    },
    pillActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: '#10B981',
    },
    pillInactive: {
        backgroundColor: 'transparent',
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    pillLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.4)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    pillLabelActive: {
        color: '#10B981',
    },
    pillDate: {
        fontSize: 18,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: 22,
    },
    pillDateActive: {
        color: '#ffffff',
        fontWeight: '800',
    },
    pillMonth: {
        fontSize: 9,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.3)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    pillMonthActive: {
        color: 'rgba(16, 185, 129, 0.8)',
    },
    activeBar: {
        width: 18,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#10B981',
        marginTop: 4,
    },
});

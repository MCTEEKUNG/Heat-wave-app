/**
 * RiskGauge — Animated SVG semicircle gauge showing heatwave probability
 * Gradient arc from green → yellow → orange → red
 * Large centered percentage text
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { RiskColors } from '@/constants/theme';
import type { RiskLevel } from '@/types/heatwave';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface RiskGaugeProps {
    probability: number; // 0–1
    riskLevel: RiskLevel;
    size?: number;
}


function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const startRad = (Math.PI / 180) * startAngle;
    const endRad = (Math.PI / 180) * endAngle;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export function RiskGauge({ probability, riskLevel, size = 260 }: RiskGaugeProps) {
    const animatedValue = useSharedValue(0);
    const cx = size / 2;
    const cy = size / 2;
    const r = (size - 20) / 2; // Use more of the available space
    const strokeWidth = 12; // Thinner stroke

    const startAngle = 135;
    const fullSweep = 270;

    useEffect(() => {
        animatedValue.value = withTiming(probability, {
            duration: 1500,
            easing: Easing.out(Easing.exp),
        });
    }, [probability]);

    // Background arc (full track)
    const bgArcPath = describeArc(cx, cy, r, startAngle, startAngle + fullSweep);

    // Calculate filled arc
    const sweepAngle = probability * fullSweep;
    const filledArcPath =
        sweepAngle > 0.5
            ? describeArc(cx, cy, r, startAngle, startAngle + Math.min(sweepAngle, fullSweep - 0.5))
            : '';

    // Needle rotation (simple circle indicator)
    const needleAngle = startAngle + sweepAngle;
    const needleRad = (Math.PI / 180) * needleAngle;
    const needleX = cx + r * Math.cos(needleRad);
    const needleY = cy + r * Math.sin(needleRad);

    const pctText = `${Math.round(probability * 100)}`;
    const riskColor = RiskColors[riskLevel] || RiskColors.LOW;

    return (
        <View style={[styles.container, { width: size, height: size * 0.85 }]}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Defs>
                    <LinearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                        <Stop offset="50%" stopColor="#F59E0B" stopOpacity={1} />
                        <Stop offset="100%" stopColor="#EF4444" stopOpacity={1} />
                    </LinearGradient>
                </Defs>

                {/* Background track - Ultra subtle */}
                <Path
                    d={bgArcPath}
                    stroke="#F4F4F5"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Filled arc - Gradient */}
                {filledArcPath ? (
                    <Path
                        d={filledArcPath}
                        stroke="url(#gaugeGrad)"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                    />
                ) : null}

                {/* Indicator Dot on the arc */}
                <Circle cx={needleX} cy={needleY} r={8} fill={riskColor.primary} stroke="#FFFFFF" strokeWidth={3} />

                {/* Percentage Text - Large & Thin */}
                <SvgText
                    x={cx}
                    y={cy + 10}
                    textAnchor="middle"
                    fontSize={64}
                    fontWeight="300" // Light/Thin font
                    fill={riskColor.primary}
                    letterSpacing={-2}
                >
                    {pctText}%
                </SvgText>

                {/* Risk Level Label */}
                <SvgText
                    x={cx}
                    y={cy + 40}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight="600"
                    fill="#A1A1AA"
                    letterSpacing={0.5}
                >
                    {riskLevel}
                </SvgText>
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

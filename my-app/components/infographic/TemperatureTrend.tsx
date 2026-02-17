/**
 * TemperatureTrend — SVG line chart for temperature trend
 * Max temperature line (red), Min temperature line (blue)
 * Filled area between, day labels on X axis
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
    Path,
    Line,
    Text as SvgText,
    Circle,
    Defs,
    LinearGradient,
    Stop,
} from 'react-native-svg';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import type { ForecastDay } from '@/types/heatwave';

interface TemperatureTrendProps {
    forecasts: ForecastDay[];
    width?: number;
    height?: number;
}

export function TemperatureTrend({ forecasts, width = 340, height = 180 }: TemperatureTrendProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    if (forecasts.length === 0) return null;

    const padding = { top: 20, right: 16, bottom: 34, left: 32 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxTemps = forecasts.map((f) => f.weather.T2M_MAX ?? 0);
    const minTemps = forecasts.map((f) => f.weather.T2M_MIN ?? 0);

    const allTemps = [...maxTemps, ...minTemps];
    const tMin = Math.floor(Math.min(...allTemps) - 2);
    const tMax = Math.ceil(Math.max(...allTemps) + 2);
    const tRange = tMax - tMin || 1;

    const toX = (i: number) => padding.left + (i / Math.max(forecasts.length - 1, 1)) * chartW;
    const toY = (t: number) => padding.top + (1 - (t - tMin) / tRange) * chartH;

    // Build SVG paths
    const maxPath = maxTemps.map((t, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(t)}`).join(' ');
    const minPath = minTemps.map((t, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(t)}`).join(' ');

    // Area between max and min
    const areaPath =
        maxTemps.map((t, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(t)}`).join(' ') +
        ' ' +
        minTemps
            .map((t, i) => `L ${toX(forecasts.length - 1 - i)} ${toY(minTemps[forecasts.length - 1 - i])}`)
            .join(' ') +
        ' Z';

    // Grid lines (horizontal)
    const gridTemps: number[] = [];
    const gridStep = tRange > 8 ? Math.ceil(tRange / 4) : 2;
    for (let t = Math.ceil(tMin / gridStep) * gridStep; t <= tMax; t += gridStep) {
        gridTemps.push(t);
    }

    return (
        <View style={styles.container}>
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <Defs>
                    <LinearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="#F97316" stopOpacity={0.2} />
                        <Stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </LinearGradient>
                </Defs>

                {/* Grid lines */}
                {gridTemps.map((t) => (
                    <React.Fragment key={`grid-${t}`}>
                        <Line
                            x1={padding.left}
                            y1={toY(t)}
                            x2={width - padding.right}
                            y2={toY(t)}
                            stroke={colorScheme === 'dark' ? '#3D3330' : '#E7E5E4'}
                            strokeWidth={1}
                            strokeDasharray="4,4"
                        />
                        <SvgText x={padding.left - 6} y={toY(t) + 4} textAnchor="end" fontSize={10} fill="#A8A29E">
                            {t}°
                        </SvgText>
                    </React.Fragment>
                ))}

                {/* Area fill */}
                <Path d={areaPath} fill="url(#areaGrad)" />

                {/* Max temp line */}
                <Path d={maxPath} stroke="#EF4444" strokeWidth={2.5} fill="none" strokeLinejoin="round" />

                {/* Min temp line */}
                <Path d={minPath} stroke="#3B82F6" strokeWidth={2.5} fill="none" strokeLinejoin="round" />

                {/* Data points + labels */}
                {forecasts.map((f, i) => (
                    <React.Fragment key={f.date}>
                        {/* Max point */}
                        <Circle cx={toX(i)} cy={toY(maxTemps[i])} r={4} fill="#EF4444" stroke="white" strokeWidth={2} />
                        <SvgText
                            x={toX(i)}
                            y={toY(maxTemps[i]) - 8}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight="bold"
                            fill="#EF4444"
                        >
                            {maxTemps[i].toFixed(0)}°
                        </SvgText>

                        {/* Min point */}
                        <Circle cx={toX(i)} cy={toY(minTemps[i])} r={4} fill="#3B82F6" stroke="white" strokeWidth={2} />
                        <SvgText
                            x={toX(i)}
                            y={toY(minTemps[i]) + 16}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight="bold"
                            fill="#3B82F6"
                        >
                            {minTemps[i].toFixed(0)}°
                        </SvgText>

                        {/* X axis label */}
                        <SvgText
                            x={toX(i)}
                            y={height - 6}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#78716C"
                            fontWeight="600"
                        >
                            {f.day_name}
                        </SvgText>
                    </React.Fragment>
                ))}
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
});

/**
 * Dashboard Screen — Full-Screen Map with Floating Overlays
 * Map is the hero. Everything else is minimal and floating.
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, RiskColors } from '@/constants/theme';
import { fetchPrediction, fetchForecast, getUseMockData } from '@/services/api';
import HeatwaveMap from '@/components/HeatwaveMap';
import { TimelineBar, type TimelineDay } from '@/components/TimelineBar';
import type { PredictionResponse, ForecastResponse, RiskLevel, WeatherData } from '@/types/heatwave';

interface DayData {
  riskLevel: RiskLevel;
  probability: number;
  advice: string;
  weather: WeatherData;
  date: string;
  bbox: { north: number; south: number; east: number; west: number };
}

const DEFAULT_BBOX = {
  north: 13.7788,
  south: 13.7338,
  east: 100.5243,
  west: 100.4793,
};

export default function DashboardScreen() {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const load = useCallback(async () => {
    try {
      const [pred, fcast] = await Promise.all([
        fetchPrediction(),
        fetchForecast(7).catch(() => null),
      ]);
      setPrediction(pred);
      setForecast(fcast);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build timeline days
  const timelineDays: TimelineDay[] = useMemo(() => {
    const days: TimelineDay[] = [];

    if (prediction) {
      days.push({
        label: 'Now',
        date: prediction.date,
        riskLevel: prediction.risk_level,
        hasData: true,
      });
    } else {
      days.push({
        label: 'Now',
        date: new Date().toISOString().split('T')[0],
        riskLevel: 'LOW',
        hasData: false,
      });
    }

    if (forecast?.forecasts) {
      forecast.forecasts.forEach((f, i) => {
        days.push({
          label: `+${i + 1}d`,
          date: f.date,
          riskLevel: (f.risk_label || f.risk_level) as RiskLevel,
          hasData: true,
        });
      });
    } else {
      for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push({
          label: `+${i}d`,
          date: d.toISOString().split('T')[0],
          riskLevel: 'LOW',
          hasData: false,
        });
      }
    }
    return days;
  }, [prediction, forecast]);

  // Current day data
  const currentDayData: DayData | null = useMemo(() => {
    if (selectedDay === 0 && prediction) {
      return {
        riskLevel: prediction.risk_level,
        probability: prediction.probability,
        advice: prediction.advice,
        weather: prediction.weather,
        date: prediction.date,
        bbox: prediction.bbox || DEFAULT_BBOX,
      };
    }
    if (selectedDay > 0 && forecast?.forecasts) {
      const f = forecast.forecasts[selectedDay - 1];
      if (f) return {
        riskLevel: (f.risk_label || f.risk_level) as RiskLevel,
        probability: f.probability,
        advice: f.advice || '',
        weather: f.weather as any,
        date: f.date,
        bbox: DEFAULT_BBOX,
      };
    }
    return null;
  }, [selectedDay, prediction, forecast]);

  const dayHasData = timelineDays[selectedDay]?.hasData ?? false;

  if (loading) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: '#0f0f1a' }]}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={styles.loadingText}>Loading heatwave data…</Text>
      </View>
    );
  }

  const riskColor = currentDayData
    ? (RiskColors[currentDayData.riskLevel] || RiskColors.LOW)
    : RiskColors.LOW;

  return (
    <View style={styles.fullScreen}>
      {/* ═══ LAYER 0: Background Map ═══ */}
      {currentDayData ? (
        <HeatwaveMap
          riskLevel={currentDayData.riskLevel}
          bbox={currentDayData.bbox}
          probability={currentDayData.probability}
          advice={currentDayData.advice}
          weather={currentDayData.weather}
          date={currentDayData.date}
          isFullScreen
        />
      ) : (
        <View style={[styles.fullScreen, { backgroundColor: '#0f0f1a' }]} />
      )}

      {/* ═══ LAYER 1: Top — Header + Timeline ═══ */}
      <View style={[styles.topOverlay, { pointerEvents: 'box-none' }]}>
        {/* Mini Header */}
        <View style={styles.header}>
          <Text style={styles.titleText}>Heatwave</Text>
          <View style={[
            styles.liveBadge,
            { backgroundColor: getUseMockData() ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)' },
          ]}>
            <View style={{
              width: 5, height: 5, borderRadius: 3,
              backgroundColor: getUseMockData() ? '#F59E0B' : '#10B981',
            }} />
            <Text style={{
              fontSize: 10, fontWeight: '700',
              color: getUseMockData() ? '#FCD34D' : '#6EE7B7',
            }}>
              {getUseMockData() ? 'MOCK' : 'LIVE'}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <TimelineBar
          days={timelineDays}
          selectedIndex={selectedDay}
          onSelectDay={setSelectedDay}
        />
      </View>

      {/* ═══ LAYER 2: Top-Right — Legend ═══ */}
      <View style={styles.legendContainer}>
        {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((level) => {
          const c = RiskColors[level];
          const isCurrentLevel = currentDayData?.riskLevel === level;
          return (
            <View key={level} style={styles.legendItem}>
              <View style={[
                styles.legendDot,
                { backgroundColor: c.primary },
                isCurrentLevel && { width: 10, height: 10, borderRadius: 5 },
              ]} />
              <Text style={[
                styles.legendLabel,
                isCurrentLevel && { color: '#fff', fontWeight: '700' },
              ]}>
                {level}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ═══ LAYER 3: Bottom-Left — Compact Info Card ═══ */}
      <View style={[styles.bottomOverlay, { pointerEvents: 'box-none' }]}>
        {!dayHasData ? (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataText}>No prediction data</Text>
          </View>
        ) : currentDayData ? (
          <View style={[styles.infoCard, { borderLeftColor: riskColor.primary }]}>
            {/* Row 1: Badge + Probability */}
            <View style={styles.cardRow1}>
              <View style={[styles.riskBadge, { backgroundColor: riskColor.primary }]}>
                <Text style={styles.riskBadgeText}>{currentDayData.riskLevel}</Text>
              </View>
              <Text style={styles.cardDot}> · </Text>
              <Text style={[styles.probText, { color: riskColor.primary }]}>
                {(currentDayData.probability * 100).toFixed(0)}%
              </Text>
            </View>
            {/* Row 2: Quick metrics */}
            <View style={styles.cardRow2}>
              {currentDayData.weather?.T2M_MAX != null && (
                <Text style={styles.miniMetric}>🌡️{currentDayData.weather.T2M_MAX.toFixed(1)}°</Text>
              )}
              {currentDayData.weather?.RH2M != null && (
                <Text style={styles.miniMetric}>💧{currentDayData.weather.RH2M.toFixed(0)}%</Text>
              )}
              {currentDayData.weather?.WS10M != null && (
                <Text style={styles.miniMetric}>💨{currentDayData.weather.WS10M.toFixed(1)}m/s</Text>
              )}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' as any,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6b7280',
  },

  /* ─── Top ─── */
  topOverlay: {
    position: 'absolute' as any,
    top: 0, left: 0, right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'web' ? 12 : 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: -0.3,
    ...({
      textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    } as any),
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  /* ─── Legend (top-right) ─── */
  legendContainer: {
    position: 'absolute' as any,
    top: Platform.OS === 'web' ? 100 : 140,
    right: 12,
    zIndex: 100,
    backgroundColor: 'rgba(15, 15, 26, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5,
    ...({
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    } as any),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  /* ─── Bottom-left compact card ─── */
  bottomOverlay: {
    position: 'absolute' as any,
    bottom: 72,
    left: 12,
    zIndex: 100,
    maxWidth: 220,
  },
  infoCard: {
    backgroundColor: 'rgba(15, 15, 26, 0.75)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderLeftWidth: 3,
    ...({
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    } as any),
  },
  cardRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardDot: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    fontWeight: '300',
  },
  probText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -1,
  },
  cardRow2: {
    flexDirection: 'row',
    gap: 8,
  },
  miniMetric: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },

  /* ─── No Data ─── */
  noDataCard: {
    backgroundColor: 'rgba(15, 15, 26, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...({
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    } as any),
  },
  noDataText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
});

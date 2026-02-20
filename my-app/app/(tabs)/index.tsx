/**
 * Dashboard Screen — Full-Screen Map with Heat Zone Overlays
 * • Requests user geolocation on load
 * • Zooms to user location
 * • Filters zones to nearby area (solves 2400+ zone lag)
 * • Auto-displays the closest zone info without clicking
 */
import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import HeatMap from '@/components/map/HeatMap';
import TimeSlider from '@/components/map/TimeSlider';
import Legend from '@/components/map/Legend';
import AlertCard from '@/components/ui/AlertCard';
import { useHeatwaveStore } from '@/store/useHeatwaveStore';
import { fetchHeatZones } from '@/services/api';
import type { HeatZone } from '@/types';

/** Max distance (degrees) to include zones — ~1° ≈ 111 km */
const PROXIMITY_RADIUS = 1.5;

/** Calculate distance in degrees between two lat/lon points */
function degreeDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLat = lat1 - lat2;
  const dLon = lon1 - lon2;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/** Get center of a polygon from its coordinates */
function getPolygonCenter(coords: number[][]): { lat: number; lon: number } {
  let lat = 0, lon = 0;
  for (const c of coords) {
    lon += c[0];
    lat += c[1];
  }
  return { lat: lat / coords.length, lon: lon / coords.length };
}

export default function DashboardScreen() {
  const {
    zones,
    nearbyZones,
    selectedZone,
    selectedDay,
    loading,
    error,
    region,
    isLive,
    userLocation,
    locationRequested,
    setZones,
    setNearbyZones,
    selectZone,
    clearSelection,
    setSelectedDay,
    setLoading,
    setError,
    setIsLive,
    setUserLocation,
    setLocationRequested,
    setRegion,
  } = useHeatwaveStore();

  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= 1024;
  const hasAutoSelected = useRef(false);

  // ─── Step 1: Request user geolocation on mount ───
  useEffect(() => {
    if (locationRequested) return;
    setLocationRequested(true);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      console.log('[Geo] Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        console.log(`[Geo] ✅ User location: ${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E`);
        setUserLocation(loc);

        // Update map region to center on user
        setRegion({
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 2.0,
          longitudeDelta: 2.0,
        });
      },
      (err) => {
        console.warn('[Geo] ❌ Location denied or failed:', err.message);
        // Continue with default Thailand region
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, [locationRequested, setUserLocation, setLocationRequested, setRegion]);

  // ─── Step 2: Filter zones by proximity to user ───
  useEffect(() => {
    if (!userLocation || zones.length === 0) {
      setNearbyZones(zones);
      return;
    }

    const filtered = zones.filter((zone) => {
      const center = getPolygonCenter(zone.geometry.coordinates[0]);
      const dist = degreeDistance(
        userLocation.latitude, userLocation.longitude,
        center.lat, center.lon,
      );
      return dist <= PROXIMITY_RADIUS;
    });

    console.log(
      `[HeatWave] Filtered ${zones.length} zones → ${filtered.length} nearby (within ${PROXIMITY_RADIUS}° of user)`,
    );

    setNearbyZones(filtered.length > 0 ? filtered : zones.slice(0, 50));
  }, [zones, userLocation, setNearbyZones]);

  // ─── Step 3: Auto-select the closest zone to user ───
  useEffect(() => {
    if (hasAutoSelected.current || !userLocation || nearbyZones.length === 0) return;
    hasAutoSelected.current = true;

    // Find the zone closest to the user
    let closestZone: HeatZone | null = null;
    let closestDist = Infinity;

    nearbyZones.forEach((zone) => {
      const center = getPolygonCenter(zone.geometry.coordinates[0]);
      const dist = degreeDistance(
        userLocation.latitude, userLocation.longitude,
        center.lat, center.lon,
      );
      if (dist < closestDist) {
        closestDist = dist;
        closestZone = zone;
      }
    });

    if (closestZone) {
      console.log(
        `[HeatWave] Auto-selected closest zone: "${(closestZone as HeatZone).properties.name}" (${closestDist.toFixed(3)}° away)`,
      );
      // Small delay so the map animates first
      setTimeout(() => selectZone(closestZone!), 1500);
    }
  }, [nearbyZones, userLocation, selectZone]);

  // ─── Load heat zones for the selected day ───
  const loadZones = useCallback(async (dayOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      const result = await fetchHeatZones(dateStr, dayOffset);
      setZones(result.zones);
      setIsLive(result.isLive);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load data';
      setError(msg);
      console.error('[Dashboard] Load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [setZones, setLoading, setError, setIsLive]);

  // Initial load
  useEffect(() => {
    loadZones(0);
  }, [loadZones]);

  // Handle day change
  const handleDayChange = useCallback(
    (day: number) => {
      setSelectedDay(day);
      clearSelection();
      hasAutoSelected.current = false;
      loadZones(day);
    },
    [setSelectedDay, clearSelection, loadZones],
  );

  // Handle zone press
  const handleZonePress = useCallback(
    (zone: HeatZone) => {
      selectZone(zone);
    },
    [selectZone],
  );

  // Handle close alert
  const handleCloseAlert = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Zones to display — use nearbyZones (filtered) instead of all zones
  const displayZones = nearbyZones;

  // Error state
  if (error && zones.length === 0) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>Pull to refresh or check API connection</Text>
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      {/* ═══ LAYER 0: Map ═══ */}
      <HeatMap
        zones={displayZones}
        region={region}
        onZonePress={handleZonePress}
        userLocation={userLocation}
      />

      {/* ═══ LAYER 1: Loading overlay ═══ */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>
            {userLocation
              ? 'Loading nearby heat zones…'
              : 'Loading heat zones…'}
          </Text>
        </View>
      )}

      {/* ═══ LAYER 2: Top — Header + TimeSlider ═══ */}
      <View style={styles.topOverlay} pointerEvents="box-none">
        {/* Mini header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.titleText}>🔥 Heat Wave</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Location badge */}
            {userLocation && (
              <View style={styles.locationBadge}>
                <Text style={styles.locationBadgeText}>
                  📍 {userLocation.latitude.toFixed(2)}°N
                </Text>
              </View>
            )}
            <View style={styles.zoneBadge}>
              <Text style={styles.zoneBadgeText}>
                {displayZones.length} zones
              </Text>
            </View>
          </View>
        </View>

        {/* TimeSlider */}
        <TimeSlider
          selectedDay={selectedDay}
          onSelectDay={handleDayChange}
        />
      </View>

      {/* ═══ LAYER 3: Legend ═══ */}
      <View
        style={[
          styles.legendContainer,
          isDesktop && styles.legendDesktop,
        ]}
        pointerEvents="box-none"
      >
        <Legend zones={displayZones} isLive={isLive} />
      </View>

      {/* ═══ LAYER 4: AlertCard bottom sheet ═══ */}
      <AlertCard zone={selectedZone} onClose={handleCloseAlert} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    position: 'relative' as const,
    backgroundColor: '#000000',
  },
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 24,
  },

  // Loading
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Error
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Top overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'web' ? 16 : 52,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    ...({
      textShadow: '0 2px 8px rgba(0,0,0,0.6)',
    } as Record<string, string>),
  },
  locationBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
  },
  zoneBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  zoneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Legend
  legendContainer: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    zIndex: 100,
  },
  legendDesktop: {
    bottom: 24,
    left: 24,
  },
});

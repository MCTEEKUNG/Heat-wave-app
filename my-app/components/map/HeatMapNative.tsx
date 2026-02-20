/**
 * HeatMapNative — React Native Maps implementation for iOS/Android
 * Renders GeoJSON heat zones as tappable polygons.
 */
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { getRiskColor, getRiskOpacity } from '@/constants/RiskLevels';
import { hexToRgba } from '@/utils/colors';
import type { HeatZone, Region } from '@/types';

interface HeatMapNativeProps {
    zones: HeatZone[];
    region: Region;
    onZonePress: (zone: HeatZone) => void;
    onRegionChange?: (region: Region) => void;
}

/**
 * Native map implementation.
 * Uses react-native-maps when available, otherwise shows a placeholder.
 *
 * To enable native maps, install:
 *   npx expo install react-native-maps
 *
 * Then uncomment the MapView + Polygon imports below.
 */
function HeatMapNativeInner({ zones, region, onZonePress }: HeatMapNativeProps) {
    // ── Placeholder until react-native-maps is installed ──
    // Uncomment the following when react-native-maps is available:
    //
    // import MapView, { Polygon, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
    //
    // const darkMapStyle = [
    //   { elementType: 'geometry', stylers: [{ color: '#212121' }] },
    //   { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    //   { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    //   { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
    //   { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
    // ];
    //
    // return (
    //   <MapView
    //     provider={PROVIDER_DEFAULT}
    //     style={StyleSheet.absoluteFillObject}
    //     customMapStyle={darkMapStyle}
    //     initialRegion={region}
    //   >
    //     {zones.map((zone) => {
    //       const color = getRiskColor(zone.properties.severity);
    //       const opacity = getRiskOpacity(zone.properties.severity);
    //       const coords = zone.geometry.coordinates[0].map(([lng, lat]) => ({
    //         latitude: lat,
    //         longitude: lng,
    //       }));
    //       return (
    //         <Polygon
    //           key={zone.id}
    //           coordinates={coords}
    //           fillColor={hexToRgba(color, opacity)}
    //           strokeColor={color}
    //           strokeWidth={2}
    //           tappable
    //           onPress={() => onZonePress(zone)}
    //         />
    //       );
    //     })}
    //   </MapView>
    // );

    return (
        <View style={styles.placeholder}>
            <Text style={styles.title}>📱 Native Map</Text>
            <Text style={styles.subtitle}>
                Install react-native-maps for native map support.
            </Text>
            <Text style={styles.hint}>
                npx expo install react-native-maps
            </Text>
            <Text style={styles.zoneCount}>
                {zones.length} heat zones loaded
            </Text>
        </View>
    );
}

const HeatMapNative = React.memo(HeatMapNativeInner);
export default HeatMapNative;

const styles = StyleSheet.create({
    placeholder: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0f0f1a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 16,
    },
    hint: {
        fontSize: 12,
        color: '#10B981',
        fontFamily: 'monospace',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 16,
        overflow: 'hidden',
    },
    zoneCount: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
    },
});

/**
 * HeatMap — Platform-agnostic wrapper
 * Selects the right map implementation (Web vs Native).
 */
import React from 'react';
import { Platform } from 'react-native';
import type { HeatZone, Region } from '@/types';

interface HeatMapProps {
    zones: HeatZone[];
    region: Region;
    onZonePress: (zone: HeatZone) => void;
    onRegionChange?: (region: Region) => void;
    userLocation?: { latitude: number; longitude: number } | null;
}

function HeatMapInner(props: HeatMapProps) {
    if (Platform.OS === 'web') {
        const HeatMapWeb = require('./HeatMapWeb').default;
        return <HeatMapWeb {...props} />;
    }

    const HeatMapNative = require('./HeatMapNative').default;
    return <HeatMapNative {...props} />;
}

const HeatMap = React.memo(HeatMapInner);
export default HeatMap;

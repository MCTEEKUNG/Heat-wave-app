// ==============================
// Heat Wave — Zustand State Store
// ==============================

import { create } from 'zustand';
import type { HeatZone, Region } from '@/types';

interface UserLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

interface HeatwaveState {
    /** All heat zones for the current day */
    zones: HeatZone[];
    /** Zones filtered to near the user */
    nearbyZones: HeatZone[];
    /** Currently selected zone (tapped/clicked) */
    selectedZone: HeatZone | null;
    /** Selected day index (0 = NOW, 1 = +1D, etc.) */
    selectedDay: number;
    /** Loading state */
    loading: boolean;
    /** Error message */
    error: string | null;
    /** Current map viewport */
    region: Region;
    /** Whether API is live or using mock data */
    isLive: boolean;
    /** User's geolocation (null if not yet obtained or denied) */
    userLocation: UserLocation | null;
    /** Whether geolocation has been requested */
    locationRequested: boolean;

    // ─── Actions ───
    setZones: (zones: HeatZone[]) => void;
    setNearbyZones: (zones: HeatZone[]) => void;
    selectZone: (zone: HeatZone | null) => void;
    clearSelection: () => void;
    setSelectedDay: (day: number) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setRegion: (region: Region) => void;
    setIsLive: (isLive: boolean) => void;
    setUserLocation: (location: UserLocation | null) => void;
    setLocationRequested: (requested: boolean) => void;
}

/** Default region: centered on Thailand */
const DEFAULT_REGION: Region = {
    latitude: 13.7563,
    longitude: 100.5018,
    latitudeDelta: 5.0,
    longitudeDelta: 5.0,
};

export const useHeatwaveStore = create<HeatwaveState>((set) => ({
    zones: [],
    nearbyZones: [],
    selectedZone: null,
    selectedDay: 0,
    loading: true,
    error: null,
    region: DEFAULT_REGION,
    isLive: false,
    userLocation: null,
    locationRequested: false,

    setZones: (zones) => set({ zones }),
    setNearbyZones: (nearbyZones) => set({ nearbyZones }),
    selectZone: (zone) => set({ selectedZone: zone }),
    clearSelection: () => set({ selectedZone: null }),
    setSelectedDay: (day) => set({ selectedDay: day }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setRegion: (region) => set({ region }),
    setIsLive: (isLive) => set({ isLive }),
    setUserLocation: (userLocation) => set({ userLocation }),
    setLocationRequested: (locationRequested) => set({ locationRequested }),
}));

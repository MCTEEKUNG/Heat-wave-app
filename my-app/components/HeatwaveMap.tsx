import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { RiskColors } from '@/constants/theme';
import type { RiskLevel } from '@/types/heatwave';

// Only load Leaflet on Web
let MapContainer: any, TileLayer: any, Polygon: any, GeoJSON: any;
if (Platform.OS === 'web') {
    try {
        const RL = require('react-leaflet');
        MapContainer = RL.MapContainer;
        TileLayer = RL.TileLayer;
        Polygon = RL.Polygon;
        GeoJSON = RL.GeoJSON;
        require('leaflet/dist/leaflet.css');
    } catch (e) {
        console.error("Failed to load leaflet:", e);
    }
}

interface HeatwaveMapProps {
    riskLevel: RiskLevel;
    bbox: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
    probability?: number;
    date?: string;
    isFullScreen?: boolean;
}

export default function HeatwaveMap({ riskLevel, bbox, isFullScreen }: HeatwaveMapProps) {
    const [geoData, setGeoData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        // Fetch GeoJSON from our Flask API
        fetch('http://localhost:5000/api/map')
            .then(res => res.json())
            .then(data => {
                setGeoData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load map data:", err);
                setLoading(false);
            });
    }, []);

    if (Platform.OS !== 'web') {
        return (
            <View style={[styles.container, isFullScreen && styles.containerFullScreen]}>
                <Text style={styles.text}>Map available on Web version only.</Text>
            </View>
        );
    }

    // Default center for Thailand if bbox is weird
    const centerLat = (bbox.north + bbox.south) / 2 || 13.0;
    const centerLon = (bbox.east + bbox.west) / 2 || 100.0;
    const zoom = isFullScreen ? 6 : 5;

    // Color style function for GeoJSON
    const onEachFeature = (feature: any, layer: any) => {
        if (feature.properties && feature.properties.temperature) {
            const temp = feature.properties.temperature;
            layer.bindPopup(`Temp: ${temp}°C`);
        }
    };

    const styleFeature = (feature: any) => {
        const temp = feature.properties.temperature;
        let color = '#3b82f6'; // Blue (cool)

        if (temp >= 30) color = '#fcd34d'; // Yellow
        if (temp >= 35) color = '#f97316'; // Orange
        if (temp >= 38) color = '#ef4444'; // Red
        if (temp >= 40) color = '#7f1d1d'; // Dark Red

        return {
            fillColor: color,
            weight: 0,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.6
        };
    };

    return (
        <View style={isFullScreen ? styles.containerFullScreen : styles.container}>
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={{ color: 'white', marginTop: 10 }}>Loading Heatwave Layers...</Text>
                </View>
            )}

            <MapContainer
                center={[centerLat, centerLon]}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {geoData && (
                    <GeoJSON
                        data={geoData}
                        style={styleFeature}
                        onEachFeature={onEachFeature}
                    />
                )}
            </MapContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 200,
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    containerFullScreen: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    text: {
        color: '#ccc',
        textAlign: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    }
});

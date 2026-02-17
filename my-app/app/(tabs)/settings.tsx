/**
 * Settings Screen — App Configuration & Information
 * Minimalist list layout
 */
import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    Switch,
    ScrollView,
    Platform,
    Linking,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getUseMockData, setUseMockData } from '@/services/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SettingsScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const [useMock, setUseMock] = React.useState(getUseMockData());

    const toggleMockData = (value: boolean) => {
        setUseMock(value);
        setUseMockData(value);
    };

    const openLink = (url: string) => {
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Could not open link');
        });
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={styles.contentContainer}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
            </View>

            {/* Data Source Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DATA SOURCE</Text>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <View style={styles.row}>
                        <View style={styles.rowIcon}>
                            <IconSymbol name="server.rack" size={24} color={theme.tint} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Mock Data Mode</Text>
                            <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>
                                Use generated data instead of live API
                            </Text>
                        </View>
                        <Switch
                            value={useMock}
                            onValueChange={toggleMockData}
                            trackColor={{ false: theme.tabIconDefault, true: theme.tint }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>
            </View>

            {/* About Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ABOUT</Text>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => openLink('https://power.larc.nasa.gov/')}
                    >
                        <View style={styles.rowIcon}>
                            <IconSymbol name="cloud.sun.fill" size={24} color="#3B82F6" />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { color: theme.text }]}>NASA POWER Project</Text>
                            <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>
                                Meteorological data source
                            </Text>
                        </View>
                        <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <View style={[styles.separator, { backgroundColor: theme.border }]} />

                    <View style={styles.row}>
                        <View style={styles.rowIcon}>
                            <IconSymbol name="info.circle.fill" size={24} color={theme.textSecondary} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Version</Text>
                            <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>v1.0.0 (Beta)</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                    Designed by Heatwave Team
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 68,
        paddingBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -1,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 12,
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        // Soft Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    rowIcon: {
        marginRight: 16,
        width: 32,
        alignItems: 'center',
    },
    rowContent: {
        flex: 1,
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    rowDesc: {
        fontSize: 13,
        marginTop: 2,
    },
    separator: {
        height: 1,
        marginLeft: 68, // Align with text
    },
    footer: {
        padding: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
    },
});

/**
 * Heatwave AI — Theme & Colors
 * Heat-gradient palette with risk-level color system.
 */

import { Platform } from 'react-native';

const tintColorLight = '#EA580C'; // Orange-600
const tintColorDark = '#F97316'; // Orange-500

export const Colors = {
  light: {
    text: '#18181B', // Zinc-900
    textSecondary: '#71717A', // Zinc-500
    background: '#FAFAFA', // Zinc-50
    surface: '#FFFFFF', // White
    surfaceElevated: '#FFFFFF',
    tint: tintColorLight,
    icon: '#A1A1AA', // Zinc-400
    tabIconDefault: '#D4D4D8', // Zinc-300
    tabIconSelected: tintColorLight,
    border: '#F4F4F5', // Zinc-100
    cardBg: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.05)', // Subtle shadow
  },
  dark: {
    text: '#FAFAFA', // Zinc-50
    textSecondary: '#A1A1AA', // Zinc-400
    background: '#09090B', // Zinc-950
    surface: '#18181B', // Zinc-900
    surfaceElevated: '#27272A', // Zinc-800
    tint: tintColorDark,
    icon: '#52525B', // Zinc-600
    tabIconDefault: '#52525B', // Zinc-600
    tabIconSelected: tintColorDark,
    border: '#27272A', // Zinc-800
    cardBg: '#18181B',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

/** Risk-level color system - Refined & Professional */
export const RiskColors = {
  LOW: {
    primary: '#10B981', // Emerald-500
    light: '#ECFDF5', // Emerald-50
    dark: '#064E3B', // Emerald-900
    gradient: ['#34D399', '#10B981'],
  },
  MEDIUM: {
    primary: '#F59E0B', // Amber-500
    light: '#FFFBEB', // Amber-50
    dark: '#78350F', // Amber-900
    gradient: ['#FCD34D', '#F59E0B'],
  },
  HIGH: {
    primary: '#F97316', // Orange-500
    light: '#FFF7ED', // Orange-50
    dark: '#7C2D12', // Orange-900
    gradient: ['#FB923C', '#F97316'],
  },
  CRITICAL: {
    primary: '#EF4444', // Red-500
    light: '#FEF2F2', // Red-50
    dark: '#7F1D1D', // Red-900
    gradient: ['#F87171', '#EF4444'],
  },
} as const;

/** Risk level emoji icons */
export const RiskIcons: Record<string, string> = {
  LOW: '🟢',
  MEDIUM: '🟡',
  HIGH: '🟠',
  CRITICAL: '🔴',
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});

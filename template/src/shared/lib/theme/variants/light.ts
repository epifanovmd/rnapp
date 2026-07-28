import { ITheme } from "../types";

// Светлая тема в оттенках Slate
export const LIGHT_COLOR_THEME = {
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textTertiary: "#64748B",
  textDisabled: "#94A3B8",

  blue50: "#EFF6FF",
  blue100: "#DBEAFE",
  blue200: "#BFDBFE",
  blue300: "#93C5FD",
  blue400: "#60A5FA",
  blue500: "#3B82F6",
  blue600: "#2563EB",
  blue700: "#1D4ED8",
  blue800: "#1E40AF",
  blue900: "#1E3A8A",

  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",

  gray100: "#F5F5F5",
  gray300: "#D4D4D4",
  gray500: "#737373",
  gray700: "#404040",
  gray900: "#171717",

  green50: "#ECFDF5",
  green100: "#D1FAE5",
  green500: "#10B981",
  green600: "#059669",
  green700: "#047857",

  orange50: "#FFFBEB",
  orange100: "#FEF3C7",
  orange500: "#F59E0B",
  orange600: "#D97706",
  orange700: "#B45309",

  red50: "#FEF2F2",
  red100: "#FEE2E2",
  red500: "#EF4444",
  red600: "#DC2626",
  red700: "#B91C1C",

  // Кнопки
  buttonPrimaryBackground: "#2563EB",
  buttonPrimaryDisabledBackground: "#93C5FD",
  buttonPrimaryText: "#FFFFFF",
  buttonPrimaryDisabledText: "#FFFFFF",

  buttonSecondaryBackground: "#CBD5E1",
  buttonSecondaryDisabledBackground: "#E2E8F0",
  buttonSecondaryText: "#1E293B",
  buttonSecondaryDisabledText: "#64748B",

  buttonDangerBackground: "#DC2626",
  buttonDangerDisabledBackground: "#FCA5A5",
  buttonDangerText: "#FFFFFF",
  buttonDangerDisabledText: "#FFFFFF",

  // Фоновые цвета (основа - slate)
  background: "#eaeff6",
  surface: "#f9fafb",
  onSurface: "#ffffff",

  black: "#000000",
  white: "#FFFFFF",
  transparent: "transparent",
};

export const DEFAULT_LIGHT_THEME: ITheme = {
  name: "Light",
  colors: LIGHT_COLOR_THEME,
};

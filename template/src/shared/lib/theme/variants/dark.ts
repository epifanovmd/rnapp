import { ITheme } from "../types";

// Темная тема в оттенках Slate
export const DARK_COLOR_THEME = {
  // Текстовые цвета (светлые на темном фоне)
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textTertiary: "#94A3B8",
  textDisabled: "#475569",

  blue50: "#1E3A8A",
  blue100: "#1E40AF",
  blue200: "#1D4ED8",
  blue300: "#2563EB",
  blue400: "#3B82F6",
  blue500: "#60A5FA",
  blue600: "#93C5FD",
  blue700: "#BFDBFE",
  blue800: "#DBEAFE",
  blue900: "#EFF6FF",

  // Slate как основная палитра (инвертированная)
  slate50: "#0F172A",
  slate100: "#1E293B",
  slate200: "#334155",
  slate300: "#475569",
  slate400: "#64748B",
  slate500: "#94A3B8",
  slate600: "#CBD5E1",
  slate700: "#E2E8F0",
  slate800: "#F1F5F9",
  slate900: "#F8FAFC",

  // Нейтральные дополнения
  gray100: "#171717",
  gray300: "#404040",
  gray500: "#737373",
  gray700: "#D4D4D4",
  gray900: "#F5F5F5",

  green50: "#022C22",
  green100: "#064E3B",
  green500: "#10B981",
  green600: "#34D399",
  green700: "#6EE7B7",

  orange50: "#451A03",
  orange100: "#78350F",
  orange500: "#F59E0B",
  orange600: "#FBBF24",
  orange700: "#FCD34D",

  red50: "#450A0A",
  red100: "#7F1D1D",
  red500: "#EF4444",
  red600: "#F87171",
  red700: "#FCA5A5",

  // Кнопки
  buttonPrimaryBackground: "#3B82F6",
  buttonPrimaryDisabledBackground: "#1E40AF",
  buttonPrimaryText: "#FFFFFF",
  buttonPrimaryDisabledText: "#94A3B8",

  buttonSecondaryBackground: "#475569",
  buttonSecondaryDisabledBackground: "#64748B",
  buttonSecondaryText: "#F1F5F9",
  buttonSecondaryDisabledText: "#94A3B8",

  buttonDangerBackground: "#EF4444",
  buttonDangerDisabledBackground: "#7F1D1D",
  buttonDangerText: "#FFFFFF",
  buttonDangerDisabledText: "#9CA3AF",

  // Фоновые цвета (основа - темный slate)
  background: "#31373f",
  surface: "#29303a",
  onSurface: "#1c222b",

  black: "#000000",
  white: "#FFFFFF",
  transparent: "transparent",
};

export const DARK_THEME: ITheme = {
  name: "Dark",
  colors: DARK_COLOR_THEME,
};

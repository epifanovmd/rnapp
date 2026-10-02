import { matchFont } from "@shopify/react-native-skia";
import { Platform, PlatformOSType } from "react-native";

/** Системное семейство Skia на платформе: «System» есть только на iOS. */
const SYSTEM_FAMILY: Partial<Record<PlatformOSType, string>> = {
  ios: "System",
  android: "sans-serif",
};

/**
 * Семейство шрифта графика: «System» и пусто — системное семейство платформы
 * (на Android «System» не существует: Skia получает шрифт без гарнитуры, и
 * подписи и тултип не рисуются), своё — как есть.
 */
export const resolveChartFontFamily = (
  fontFamily: string | undefined,
  os: PlatformOSType,
): string =>
  !fontFamily || fontFamily === "System"
    ? (SYSTEM_FAMILY[os] ?? "sans-serif")
    : fontFamily;

/** Шрифт подписей графика с семейством, понятным Skia на текущей платформе. */
export const matchChartFont = (fontFamily: string | undefined, fontSize: number) =>
  matchFont({
    fontFamily: resolveChartFontFamily(fontFamily, Platform.OS),
    fontSize,
  });

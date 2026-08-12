import { DEEPLINK_BASE_URL } from "@shared/config/env";

/**
 * Пути экранов объявлены в static-конфиге (`linking:` у экранов в
 * App.screens.ts / app-tab-screens.tsx) — конфиг deep linking'а
 * генерируется из него автоматически (`enabled: "auto"`).
 */
export const linking = {
  enabled: "auto" as const,
  prefixes: [`${DEEPLINK_BASE_URL}://`],
};

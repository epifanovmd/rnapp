import { formatAppVersion } from "@shared/lib/utils";
import {
  getApplicationName,
  getBuildNumber,
  getVersion,
} from "react-native-device-info";

/** Название приложения из нативной сборки (DISPLAY_NAME окружения). */
export const APP_NAME = getApplicationName();

/** Версия приложения с номером сборки: `1.2.0 (42)`. */
export const APP_VERSION = formatAppVersion(getVersion(), getBuildNumber());

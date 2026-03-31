import { iocHook } from "@di";

import { INotificationSettingsStore } from "../NotificationSettingsStore.types";

export const useNotificationSettingsStore = iocHook(INotificationSettingsStore);

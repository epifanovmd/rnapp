import { ContainerModule } from "inversify";

import { NotificationStore } from "./notification.store";
import { INotificationService, INotificationStore } from "./notification.types";

export const notificationModule = new ContainerModule(({ bind }) => {
  bind(INotificationStore.Tid).to(NotificationStore).inSingletonScope();
  // Публичный API и стор хоста — один и тот же singleton (ISP: разные контракты).
  bind(INotificationService.Tid).toService(INotificationStore.Tid);
});

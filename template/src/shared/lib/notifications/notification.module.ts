import { ContainerModule } from "inversify";

import { INotificationService } from "./notification.types";
import { NotificationService } from "./notification-service";

export const notificationModule = new ContainerModule(({ bind }) => {
  bind(INotificationService.Tid).to(NotificationService).inSingletonScope();
});

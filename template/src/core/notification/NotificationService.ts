import { createServiceDecorator } from "@di";

import { notificationService } from "./notificationServiceInstance";

export interface NotificationOptions {
  duration?: number;
}

export const INotificationService =
  createServiceDecorator<INotificationService>();

export interface INotificationService {
  success(message: string, options?: NotificationOptions): void;
  error(message: string, options?: NotificationOptions): void;
  warning(message: string, options?: NotificationOptions): void;
  info(message: string, options?: NotificationOptions): void;
}

@INotificationService({ inSingleton: true })
export class NotificationService implements INotificationService {
  success(message: string, { duration } = {} as NotificationOptions): void {
    notificationService.show(message, { type: "success", duration });
  }

  error(message: string, { duration } = {} as NotificationOptions): void {
    notificationService.show(message, { type: "danger", duration });
  }

  warning(message: string, { duration } = {} as NotificationOptions): void {
    notificationService.show(message, { type: "warning", duration });
  }

  info(message: string, { duration } = {} as NotificationOptions): void {
    notificationService.show(message, { type: "normal", duration });
  }
}

import { INotificationService } from "../notification.types";

/** Доступ к API уведомлений из компонентов; вне React — `INotificationService.getInstance()`. */
export const useNotifications = (): INotificationService =>
  INotificationService.useInstance();

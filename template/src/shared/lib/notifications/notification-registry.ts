import { NotificationActions } from "./Notification";

/**
 * Мост между императивным NotificationService (используется вне React,
 * например в HttpClient) и смонтированным <NotificationProvider>.
 * RN не имеет глобального тост-стора вроде react-hot-toast — рендер-хост
 * обязан существовать в дереве, поэтому Provider регистрирует свой ref здесь.
 */
let activeNotificationActions: NotificationActions | null = null;

export const registerNotificationActions = (
  actions: NotificationActions | null,
): void => {
  activeNotificationActions = actions;
};

export const getNotificationActions = (): NotificationActions | null =>
  activeNotificationActions;

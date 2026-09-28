import { createInjectDecorator } from "@shared/lib/di";
import type * as React from "react";

export type NotificationVariant =
  "info" | "success" | "warning" | "error" | "loading";

export type NotificationPosition = "top" | "bottom";

export type NotificationDismissReason =
  "timeout" | "swipe" | "press" | "action" | "manual" | "cleared";

/** Кнопка действия внутри уведомления. */
export interface NotificationAction {
  label: string;
  onPress: () => void;
  /** Закрывать уведомление после нажатия (по умолчанию true). */
  dismissOnPress?: boolean;
}

export interface NotificationOptions {
  /** Явный id; по умолчанию генерируется. */
  id?: string;
  /**
   * Ключ дедупликации: если уведомление с тем же key уже показано/в очереди,
   * оно обновляется вместо создания дубликата.
   */
  key?: string;
  variant?: NotificationVariant;
  title?: React.ReactNode;
  position?: NotificationPosition;
  /** Время жизни в мс; 0 — не скрывать по таймеру. */
  duration?: number;
  /** Кастомная иконка вместо иконки варианта. */
  icon?: React.ReactNode;
  action?: NotificationAction;
  /** Закрывать по тапу (дефолт — из конфига). */
  dismissOnPress?: boolean;
  /** Разрешить свайп к краю экрана (дефолт — из конфига). */
  swipeToDismiss?: boolean;
  /** Haptic-отклик при показе (дефолт — из конфига). */
  haptic?: boolean;
  /** Произвольные данные для кастомного рендера. */
  data?: unknown;
  onPress?: () => void;
  onDismiss?: (reason: NotificationDismissReason) => void;
  /** Полностью кастомный рендер контента уведомления. */
  render?: (notification: NotificationInstance) => React.ReactNode;
}

/** Снимок показанного уведомления — то, что рендерит host. */
export interface NotificationInstance extends Omit<
  NotificationOptions,
  | "id"
  | "variant"
  | "position"
  | "duration"
  | "dismissOnPress"
  | "swipeToDismiss"
> {
  id: string;
  variant: NotificationVariant;
  message: React.ReactNode;
  position: NotificationPosition;
  duration: number;
  dismissOnPress: boolean;
  swipeToDismiss: boolean;
  createdAt: number;
  /** true — уведомление проигрывает анимацию скрытия и ждёт finalize(). */
  closing: boolean;
}

export type NotificationUpdate = Partial<
  Omit<NotificationInstance, "id" | "createdAt" | "closing">
>;

export interface NotificationPromiseMessages<T> {
  loading: React.ReactNode;
  success: React.ReactNode | ((value: T) => React.ReactNode);
  error: React.ReactNode | ((error: unknown) => React.ReactNode);
}

export interface NotificationConfig {
  /** Позиция по умолчанию. */
  position: NotificationPosition;
  /** Максимум одновременно видимых; остальные ждут в очереди. */
  maxVisible: number;
  /** Время жизни по умолчанию, мс. */
  duration: number;
  /** Переопределение времени жизни по вариантам. */
  durationByVariant: Partial<Record<NotificationVariant, number>>;
  swipeToDismiss: boolean;
  dismissOnPress: boolean;
  /** Haptic-отклик для success/warning/error. */
  haptic: boolean;
  /** Озвучивать строковые уведомления скринридером. */
  announceForAccessibility: boolean;
}

export const INotificationService = createInjectDecorator<INotificationService>(
  "INotificationService",
);

/** Публичный API уведомлений — одинаков в компонентах и вне React. */
export interface INotificationService {
  show(message: React.ReactNode, options?: NotificationOptions): string;
  info(message: React.ReactNode, options?: NotificationOptions): string;
  success(message: React.ReactNode, options?: NotificationOptions): string;
  warning(message: React.ReactNode, options?: NotificationOptions): string;
  error(message: React.ReactNode, options?: NotificationOptions): string;
  /** duration по умолчанию 0 — скрывается только явно (dismiss/update). */
  loading(message: React.ReactNode, options?: NotificationOptions): string;
  /** loading → success/error поверх одного уведомления. */
  promise<T>(
    promise: Promise<T>,
    messages: NotificationPromiseMessages<T>,
    options?: NotificationOptions,
  ): Promise<T>;
  /** Обновляет показанное/ожидающее уведомление; false — если id не найден. */
  update(id: string, patch: NotificationUpdate): boolean;
  dismiss(id: string, reason?: NotificationDismissReason): void;
  dismissAll(): void;
  configure(config: Partial<NotificationConfig>): void;
}

export const INotificationStore =
  createInjectDecorator<INotificationStore>("INotificationStore");

/** Внутренний контракт для UI-хоста: состояние + управление таймерами. */
export interface INotificationStore extends INotificationService {
  readonly visible: ReadonlyArray<NotificationInstance>;
  readonly config: NotificationConfig;
  /** Приостановить автоскрытие (жест/интеракция). */
  pauseTimer(id: string): void;
  resumeTimer(id: string): void;
  /** Убрать уведомление после завершения анимации скрытия. */
  finalize(id: string): void;
}

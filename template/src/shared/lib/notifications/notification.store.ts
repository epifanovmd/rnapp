import { createRandomId } from "@shared/lib/utils";
import { injectable } from "inversify";
import { action, computed, makeObservable, observable } from "mobx";
import type * as React from "react";
import { AccessibilityInfo } from "react-native";
import haptic, { HapticFeedbackTypes } from "react-native-haptic-feedback";

import {
  INotificationStore,
  NotificationConfig,
  NotificationDismissReason,
  NotificationInstance,
  NotificationOptions,
  NotificationPromiseMessages,
  NotificationUpdate,
  NotificationVariant,
} from "./notification.types";

const DEFAULT_CONFIG: NotificationConfig = {
  position: "top",
  maxVisible: 3,
  duration: 4000,
  durationByVariant: { error: 6000 },
  swipeToDismiss: true,
  dismissOnPress: true,
  haptic: true,
  announceForAccessibility: true,
};

const HAPTIC_BY_VARIANT: Partial<
  Record<NotificationVariant, HapticFeedbackTypes>
> = {
  success: HapticFeedbackTypes.notificationSuccess,
  warning: HapticFeedbackTypes.notificationWarning,
  error: HapticFeedbackTypes.notificationError,
};

interface NotificationTimer {
  timeoutId: ReturnType<typeof setTimeout>;
  startedAt: number;
  remaining: number;
}

/**
 * Единственный источник истины системы уведомлений: видимый стек, очередь,
 * таймеры автоскрытия. Живёт в DI-контейнере singleton'ом, поэтому API доступен
 * и вне React (`INotificationService.getInstance()`), и в компонентах
 * (`useNotifications()`); UI — тонкий observer `<NotificationHost />`.
 * Уведомления, показанные до монтирования хоста, не теряются — отрисуются при
 * его появлении.
 */
@injectable()
export class NotificationStore implements INotificationStore {
  private readonly _visible = observable.array<NotificationInstance>([], {
    deep: false,
  });
  private readonly _queue = observable.array<NotificationInstance>([], {
    deep: false,
  });
  private readonly _timers = new Map<string, NotificationTimer>();

  readonly config: NotificationConfig = observable.object(
    { ...DEFAULT_CONFIG },
    {},
    { deep: false },
  );

  constructor() {
    makeObservable(this, {
      visible: computed,
      show: action,
      update: action,
      dismiss: action,
      dismissAll: action,
      finalize: action,
      configure: action,
    });
  }

  get visible(): ReadonlyArray<NotificationInstance> {
    return this._visible;
  }

  show(message: React.ReactNode, options: NotificationOptions = {}): string {
    if (options.key) {
      const existing = this._findByKey(options.key);

      if (existing) {
        this.update(existing.id, {
          ...this._patchFromOptions(options),
          message,
        });

        return existing.id;
      }
    }

    const instance = this._create(message, options);

    if (this._activeCount < this.config.maxVisible) {
      this._activate(instance);
    } else {
      this._queue.push(instance);
    }

    return instance.id;
  }

  info(message: React.ReactNode, options?: NotificationOptions): string {
    return this.show(message, { ...options, variant: "info" });
  }

  success(message: React.ReactNode, options?: NotificationOptions): string {
    return this.show(message, { ...options, variant: "success" });
  }

  warning(message: React.ReactNode, options?: NotificationOptions): string {
    return this.show(message, { ...options, variant: "warning" });
  }

  error(message: React.ReactNode, options?: NotificationOptions): string {
    return this.show(message, { ...options, variant: "error" });
  }

  loading(message: React.ReactNode, options?: NotificationOptions): string {
    return this.show(message, { ...options, variant: "loading" });
  }

  async promise<T>(
    promise: Promise<T>,
    messages: NotificationPromiseMessages<T>,
    options?: NotificationOptions,
  ): Promise<T> {
    const id = this.loading(messages.loading, options);

    try {
      const value = await promise;
      const message =
        typeof messages.success === "function"
          ? messages.success(value)
          : messages.success;

      this._settlePromise(id, "success", message, options);

      return value;
    } catch (error) {
      const message =
        typeof messages.error === "function"
          ? messages.error(error)
          : messages.error;

      this._settlePromise(id, "error", message, options);
      throw error;
    }
  }

  update(id: string, patch: NotificationUpdate): boolean {
    const updateIn = (list: NotificationInstance[]): boolean => {
      const index = list.findIndex(item => item.id === id);

      if (index === -1 || list[index].closing) {
        return false;
      }

      const previous = list[index];
      const next: NotificationInstance = { ...previous, ...patch };
      const variantChanged =
        patch.variant !== undefined && patch.variant !== previous.variant;

      if (patch.duration === undefined && variantChanged) {
        next.duration = this._resolveDuration(next.variant, undefined);
      }

      list[index] = next;

      if (list === this._visible) {
        this._startTimer(next);

        if (variantChanged) {
          this._feedback(next);
        }
      }

      return true;
    };

    return updateIn(this._visible) || updateIn(this._queue);
  }

  dismiss(id: string, reason: NotificationDismissReason = "manual"): void {
    const queued = this._queue.find(item => item.id === id);

    if (queued) {
      this._queue.remove(queued);
      queued.onDismiss?.(reason);

      return;
    }

    const index = this._visible.findIndex(candidate => candidate.id === id);
    const item = index === -1 ? undefined : this._visible[index];

    if (!item || item.closing) {
      return;
    }

    this._clearTimer(id);
    this._visible[index] = { ...item, closing: true };
    item.onDismiss?.(reason);
  }

  dismissAll(): void {
    const queued = this._queue.slice();

    this._queue.replace([]);
    queued.forEach(item => item.onDismiss?.("cleared"));
    this._visible
      .filter(item => !item.closing)
      .forEach(item => this.dismiss(item.id, "cleared"));
  }

  finalize(id: string): void {
    const item = this._visible.find(candidate => candidate.id === id);

    if (!item) {
      return;
    }

    this._clearTimer(id);
    this._visible.remove(item);
    this._promoteQueue();
  }

  configure(config: Partial<NotificationConfig>): void {
    Object.assign(this.config, config, {
      durationByVariant: {
        ...this.config.durationByVariant,
        ...config.durationByVariant,
      },
    });
  }

  pauseTimer(id: string): void {
    const timer = this._timers.get(id);

    if (!timer) {
      return;
    }

    clearTimeout(timer.timeoutId);
    timer.remaining -= Date.now() - timer.startedAt;
  }

  resumeTimer(id: string): void {
    const timer = this._timers.get(id);

    if (!timer) {
      return;
    }

    if (timer.remaining <= 0) {
      this.dismiss(id, "timeout");

      return;
    }

    timer.startedAt = Date.now();
    timer.timeoutId = setTimeout(
      () => this.dismiss(id, "timeout"),
      timer.remaining,
    );
  }

  private get _activeCount(): number {
    return this._visible.filter(item => !item.closing).length;
  }

  private _findByKey(key: string): NotificationInstance | undefined {
    return (
      this._visible.find(item => item.key === key && !item.closing) ??
      this._queue.find(item => item.key === key)
    );
  }

  private _create(
    message: React.ReactNode,
    options: NotificationOptions,
  ): NotificationInstance {
    const variant = options.variant ?? "info";

    return {
      ...options,
      id: options.id ?? createRandomId(),
      variant,
      message,
      position: options.position ?? this.config.position,
      duration: this._resolveDuration(variant, options.duration),
      dismissOnPress: options.dismissOnPress ?? this.config.dismissOnPress,
      swipeToDismiss: options.swipeToDismiss ?? this.config.swipeToDismiss,
      createdAt: Date.now(),
      closing: false,
    };
  }

  private _patchFromOptions(options: NotificationOptions): NotificationUpdate {
    const { id: _id, key: _key, ...patch } = options;

    return patch;
  }

  private _activate(instance: NotificationInstance): void {
    this._visible.push(instance);
    this._startTimer(instance);
    this._feedback(instance);
  }

  private _promoteQueue(): void {
    while (
      this._queue.length > 0 &&
      this._activeCount < this.config.maxVisible
    ) {
      const [next] = this._queue.splice(0, 1);

      this._activate(next);
    }
  }

  private _settlePromise(
    id: string,
    variant: NotificationVariant,
    message: React.ReactNode,
    options?: NotificationOptions,
  ): void {
    const patch: NotificationUpdate = { variant, message };

    if (options?.duration !== undefined) {
      patch.duration = options.duration;
    }

    if (!this.update(id, patch)) {
      this.show(message, { ...options, variant });
    }
  }

  private _resolveDuration(
    variant: NotificationVariant,
    explicit: number | undefined,
  ): number {
    if (explicit !== undefined) {
      return explicit;
    }

    if (variant === "loading") {
      return 0;
    }

    return this.config.durationByVariant[variant] ?? this.config.duration;
  }

  private _startTimer(instance: NotificationInstance): void {
    this._clearTimer(instance.id);

    if (instance.duration <= 0) {
      return;
    }

    this._timers.set(instance.id, {
      timeoutId: setTimeout(
        () => this.dismiss(instance.id, "timeout"),
        instance.duration,
      ),
      startedAt: Date.now(),
      remaining: instance.duration,
    });
  }

  private _clearTimer(id: string): void {
    const timer = this._timers.get(id);

    if (timer) {
      clearTimeout(timer.timeoutId);
      this._timers.delete(id);
    }
  }

  private _feedback(instance: NotificationInstance): void {
    const hapticType = HAPTIC_BY_VARIANT[instance.variant];

    if ((instance.haptic ?? this.config.haptic) && hapticType) {
      haptic.trigger(hapticType);
    }

    if (this.config.announceForAccessibility) {
      const text = [instance.title, instance.message]
        .filter(part => typeof part === "string")
        .join(". ");

      if (text) {
        AccessibilityInfo.announceForAccessibility(text);
      }
    }
  }
}

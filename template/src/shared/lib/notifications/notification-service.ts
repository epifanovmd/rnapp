import { createRandomId } from "@shared/lib/utils";
import { injectable } from "inversify";
import type * as React from "react";

import {
  INotificationService,
  NotificationOptions,
  PromiseMessages,
} from "./notification.types";
import { getNotificationActions } from "./notification-registry";

/**
 * RN-хост (см. Notification.tsx) — single-toast: show() всегда скрывает предыдущий
 * тост перед показом нового, это осознанное UX-решение, не ограничение архитектуры.
 * id генерируется для совместимости с портируемым контрактом (dismiss(id?)), но
 * реально всегда скрывает единственный активный тост, не адресует по id.
 */
@injectable()
export class NotificationService implements INotificationService {
  success(message: React.ReactNode, options?: NotificationOptions): string {
    return this._show("success", message, options);
  }

  error(message: React.ReactNode, options?: NotificationOptions): string {
    return this._show("danger", message, options);
  }

  warning(message: React.ReactNode, options?: NotificationOptions): string {
    return this._show("warning", message, options);
  }

  info(message: React.ReactNode, options?: NotificationOptions): string {
    return this._show("normal", message, options);
  }

  /** duration игнорируется — loading-тост не скрывается по таймеру, только явным dismiss()/следующим show(). */
  loading(message: React.ReactNode, options?: NotificationOptions): string {
    return this._show("loading", message, { ...options, duration: 0 });
  }

  async promise<T>(
    promise: Promise<T>,
    messages: PromiseMessages<T>,
    options?: NotificationOptions,
  ): Promise<T> {
    const id = this.loading(messages.loading, options);

    try {
      const value = await promise;
      const text =
        typeof messages.success === "function"
          ? messages.success(value)
          : messages.success;

      this.success(text, { ...options, id });

      return value;
    } catch (error) {
      const text =
        typeof messages.error === "function"
          ? messages.error(error)
          : messages.error;

      this.error(text, { ...options, id });
      throw error;
    }
  }

  dismiss(): void {
    getNotificationActions()?.hide();
  }

  private _show(
    type: "success" | "danger" | "warning" | "normal" | "loading",
    message: React.ReactNode,
    { id, duration }: NotificationOptions = {},
  ): string {
    const toastId = id ?? createRandomId();

    getNotificationActions()?.show(message as string | React.JSX.Element, {
      type,
      duration,
    });

    return toastId;
  }
}

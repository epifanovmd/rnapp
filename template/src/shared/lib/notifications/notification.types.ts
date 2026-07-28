import { createInjectDecorator } from "@shared/lib/di";
import type * as React from "react";

export interface NotificationOptions {
  id?: string;
  title?: React.ReactNode;
  duration?: number;
}

export interface PromiseMessages<T> {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((error: unknown) => string);
}

export const INotificationService =
  createInjectDecorator<INotificationService>();

export interface INotificationService {
  success(message: React.ReactNode, options?: NotificationOptions): string;
  error(message: React.ReactNode, options?: NotificationOptions): string;
  warning(message: React.ReactNode, options?: NotificationOptions): string;
  info(message: React.ReactNode, options?: NotificationOptions): string;
  loading(message: React.ReactNode, options?: NotificationOptions): string;
  promise<T>(
    promise: Promise<T>,
    messages: PromiseMessages<T>,
    options?: NotificationOptions,
  ): Promise<T>;
  dismiss(id?: string): void;
}

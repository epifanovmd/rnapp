import type { ITokenSource } from "@shared/lib/http";
import type { INotificationService } from "@shared/lib/notifications/notification.types";

/** Общий вход фабрик HTTP-клиентов; стек middleware каждый выбирает сам. */
export interface ApiClientDeps {
  session: ITokenSource;
  notifications: INotificationService;
}

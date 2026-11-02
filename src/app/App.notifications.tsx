import { NotificationHost } from "@shared/lib/notifications";
import React, { FC, PropsWithChildren } from "react";

/** Точка монтирования системы уведомлений; поверх всего UI приложения. */
export const AppNotifications: FC<PropsWithChildren> = ({ children }) => (
  <>
    {children}
    <NotificationHost />
  </>
);

import { useContext } from "react";

import { NotificationContext } from "./NotificationProvider";

/** Низкоуровневый доступ к тост-рефу (show/update/hide) через React Context. */
export const useNotificationActions = () => {
  const notification = useContext(NotificationContext);

  if (!notification) {
    throw new Error("NotificationContext is not provided");
  }

  return notification;
};

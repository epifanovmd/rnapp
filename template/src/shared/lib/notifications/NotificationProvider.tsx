import React, { FC, memo, useEffect, useRef, useState } from "react";

import {
  Notification,
  NotificationActions,
  NotificationProps,
} from "./Notification";
import { registerNotificationActions } from "./notification-registry";

type PropsWithChildren = NotificationProps & {
  children: React.ReactNode;
};

export const NotificationContext = React.createContext(
  undefined as unknown as NotificationActions,
);

export const NotificationProvider: FC<PropsWithChildren> = memo(
  ({ children, ...props }) => {
    const toastRef = useRef<NotificationActions>(null);
    const [refState, setRefState] = useState<NotificationActions>(
      {} as NotificationActions,
    );

    useEffect(() => {
      if (toastRef.current) {
        setRefState(toastRef.current);
        registerNotificationActions(toastRef.current);
      }

      return () => registerNotificationActions(null);
    }, []);

    return (
      <NotificationContext.Provider value={refState}>
        {children}
        <Notification ref={toastRef} {...props} />
      </NotificationContext.Provider>
    );
  },
);

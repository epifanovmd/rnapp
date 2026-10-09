import { useNotifications } from "@shared/lib/notifications";
import { Tag, Touchable } from "@shared/ui";
import React, { FC } from "react";

import type { IStatusView } from "../lib/status";

interface IStatusViewTagProps {
  view: IStatusView;
  /** Точка-индикатор перед подписью. */
  dot?: boolean;
  /** Пояснение к статусу: показывается по нажатию. */
  message?: string | null;
}

/** Метка статуса по готовому виду: подпись, окраска и пояснение по нажатию. */
export const StatusViewTag: FC<IStatusViewTagProps> = ({
  view,
  dot,
  message,
}) => {
  const toast = useNotifications();
  const tag = (
    <Tag variant={view.variant} dot={dot}>
      {view.label}
    </Tag>
  );

  if (!message) return tag;

  return (
    <Touchable onPress={() => toast.info(message, { title: view.label })}>
      {tag}
    </Touchable>
  );
};

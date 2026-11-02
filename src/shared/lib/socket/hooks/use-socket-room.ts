import { useLatestRef } from "@shared/lib/hooks";
import { useEffect } from "react";

import { subscribeSocketRoom } from "../rooms";
import { ISocketTransport } from "../transport";

/**
 * Серверная комната `type:id` на время жизни компонента; без `id` — не
 * подписывается. `onRejoin` — после переподключения: события за время
 * обрыва потеряны, данные нужно перечитать.
 */
export const useSocketRoom = (
  type: string,
  id: string | null | undefined,
  onRejoin?: () => void,
): void => {
  const socket = ISocketTransport.useInstance();
  const onRejoinRef = useLatestRef(onRejoin);

  useEffect(() => {
    if (!id) return;

    return subscribeSocketRoom(socket, type, id, () => onRejoinRef.current?.());
  }, [socket, type, id, onRejoinRef]);
};

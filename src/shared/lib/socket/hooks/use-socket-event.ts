import { useLatestRef } from "@shared/lib/hooks";
import { useEffect } from "react";

import { ISocketTransport } from "../transport";

/**
 * Обработчик события сервера на время жизни компонента. Обработчик всегда
 * свежий (видит актуальные пропсы), переподписка — только при смене события
 * или `enabled`.
 */
export const useSocketEvent = <TArgs extends unknown[]>(
  event: string,
  handler: (...args: TArgs) => void,
  enabled = true,
): void => {
  const socket = ISocketTransport.useInstance();
  const handlerRef = useLatestRef(handler);

  useEffect(() => {
    if (!enabled) return;

    return socket.on<TArgs>(event, (...args) => handlerRef.current(...args));
  }, [socket, event, enabled, handlerRef]);
};

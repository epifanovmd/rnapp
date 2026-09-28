import { useEffect, useState } from "react";

import { ISocketTransport, SocketTransportState } from "../transport";

export const useSocketStatus = (): SocketTransportState => {
  const transport = ISocketTransport.useInstance();
  const [state, setState] = useState<SocketTransportState>(transport.state);

  useEffect(() => {
    return transport.onStatusChange(setState);
  }, [transport]);

  return state;
};

// ─── useIsSocketConnected ─────────────────────────────────────────────────────

/** Lightweight boolean for components that only care about connectivity. */
export const useIsSocketConnected = (): boolean => {
  const { status } = useSocketStatus();

  return status === "connected";
};

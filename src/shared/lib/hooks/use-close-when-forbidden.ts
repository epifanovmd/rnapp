import { useEffect } from "react";

import { useLatestRef } from "./use-latest-ref";

/**
 * Закрыть открытое окно, когда действие в нём стало недоступно (права
 * отозваны, пока окно открыто).
 */
export const useCloseWhenForbidden = (
  open: boolean,
  allowed: boolean,
  close: () => void,
): void => {
  const closeRef = useLatestRef(close);

  useEffect(() => {
    if (open && !allowed) closeRef.current();
  }, [open, allowed, closeRef]);
};

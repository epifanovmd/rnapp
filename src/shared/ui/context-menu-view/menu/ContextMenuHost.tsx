import React, { memo, useCallback, useSyncExternalStore } from "react";

import { contextMenuController } from "../context-menu-controller";
import { ContextMenuCloseResult } from "../types";
import { ContextMenuOverlay } from "./ContextMenuOverlay";

/**
 * Единственная точка монтирования меню — ставится один раз в `App.tsx`.
 * Благодаря этому оверлея нет в каждом элементе списка.
 */

const getRequest = () => contextMenuController.request;

export const ContextMenuHost = memo(() => {
  const request = useSyncExternalStore(
    contextMenuController.subscribe,
    getRequest,
  );

  const handleClosed = useCallback(
    (result: ContextMenuCloseResult) => {
      request?.onClosed(result);
      contextMenuController.finish();
    },
    [request],
  );

  if (!request) {
    return null;
  }

  return (
    <ContextMenuOverlay
      session={request.session}
      sourceStyle={request.sourceStyle}
      onShown={request.onShown}
      onClosed={handleClosed}
    >
      {request.content}
    </ContextMenuOverlay>
  );
});

ContextMenuHost.displayName = "ContextMenuHost";

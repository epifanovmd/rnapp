import React, { memo, useCallback, useSyncExternalStore } from "react";

import { contextMenuController } from "../context-menu-controller";
import { ContextMenuCloseResult } from "../types";
import { ContextMenuOverlay } from "./ContextMenuOverlay";

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
      theme={request.theme}
      sourceStyle={request.sourceStyle}
      onShown={request.onShown}
      onClosed={handleClosed}
    >
      {request.content}
    </ContextMenuOverlay>
  );
});

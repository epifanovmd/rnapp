import { useSyncExternalStore } from "react";

import { ChatAdaptiveRenderMode, useChatViewContext } from "../model";

/**
 * Режим рендера строки. Работает и в оверлее контекстного меню, где хуки
 * списка недоступны.
 */
export const useChatAdaptiveRender = (): ChatAdaptiveRenderMode => {
  const { adaptiveRender } = useChatViewContext();

  return useSyncExternalStore(adaptiveRender.subscribe, adaptiveRender.getMode);
};

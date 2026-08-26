import { RefObject, useMemo } from "react";

import { IChatColors, IChatStyles } from "../config";
import { ChatContentRegistry } from "../content";
import {
  ChatAdaptiveRenderStore,
  ChatHighlightStore,
  IChatCellActions,
  IChatStickyDate,
  IChatViewContextValue,
} from "../model";

export interface IChatViewContextOptions {
  colors: IChatColors;
  styles: IChatStyles;
  contentTypes: ChatContentRegistry;
  actions: RefObject<IChatCellActions>;
  highlight: ChatHighlightStore;
  adaptiveRender: ChatAdaptiveRenderStore;
  stickyDate: IChatStickyDate;
}

/** Значение контекста чата: палитра, стили и общие для ячеек объекты. */
export const useChatViewContextValue = ({
  colors,
  styles,
  contentTypes,
  actions,
  highlight,
  adaptiveRender,
  stickyDate,
}: IChatViewContextOptions): IChatViewContextValue =>
  useMemo(
    () => ({
      colors,
      styles,
      contentTypes,
      actions,
      highlight,
      adaptiveRender,
      stickyDate,
    }),
    [
      colors,
      styles,
      contentTypes,
      actions,
      highlight,
      adaptiveRender,
      stickyDate,
    ],
  );

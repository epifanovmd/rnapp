import { RefObject, useMemo } from "react";

import {
  createInputBarStyles,
  IInputBarContextValue,
  IInputBarLayout,
  INPUT_BAR_DEFAULT_FEATURES,
} from "../../input-bar";
import {
  ChatHighlightStore,
  IChatCellActions,
  IChatStickyDate,
  IChatViewContextValue,
} from "../model";
import { IChatConfig } from "./useChatConfig";

export interface IChatViewContextOptions extends IChatConfig {
  actions: RefObject<IChatCellActions>;
  highlight: ChatHighlightStore;
  stickyDate: IChatStickyDate;
}

/** Значение контекста чата: конфигурация плюс общие для ячеек объекты. */
export const useChatViewContextValue = ({
  theme,
  layout,
  inputBarLayout,
  features,
  styles,
  actions,
  highlight,
  stickyDate,
}: IChatViewContextOptions): IChatViewContextValue =>
  useMemo(
    () => ({
      theme,
      layout,
      inputBarLayout,
      features,
      styles,
      actions,
      highlight,
      stickyDate,
    }),
    [
      theme,
      layout,
      inputBarLayout,
      features,
      styles,
      actions,
      highlight,
      stickyDate,
    ],
  );

/**
 * Значение контекста панели ввода.
 *
 * Тема и метрики совпадают с чатом ключ в ключ, поэтому передаются те же
 * объекты — панель читает из них свои.
 */
export const useInputBarContextValue = (
  theme: IChatViewContextValue["theme"],
  layout: IInputBarLayout,
): IInputBarContextValue =>
  useMemo(
    () => ({
      theme,
      layout,
      features: INPUT_BAR_DEFAULT_FEATURES,
      styles: createInputBarStyles(theme, layout),
    }),
    [theme, layout],
  );

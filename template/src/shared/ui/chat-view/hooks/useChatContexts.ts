import { RefObject, useMemo } from "react";

import {
  createInputBarStyles,
  IInputBarContextValue,
  IInputBarFeatures,
  IInputBarLayout,
} from "../../input-bar";
import { ChatContentRegistry } from "../content";
import {
  ChatAdaptiveRenderStore,
  ChatHighlightStore,
  IChatCellActions,
  IChatStickyDate,
  IChatViewContextValue,
} from "../model";
import { IChatConfig } from "./useChatConfig";

export interface IChatViewContextOptions extends IChatConfig {
  contentTypes: ChatContentRegistry;
  actions: RefObject<IChatCellActions>;
  highlight: ChatHighlightStore;
  adaptiveRender: ChatAdaptiveRenderStore;
  stickyDate: IChatStickyDate;
}

/** Значение контекста чата: конфигурация плюс общие для ячеек объекты. */
export const useChatViewContextValue = ({
  theme,
  layout,
  inputBarLayout,
  features,
  styles,
  contentTypes,
  actions,
  highlight,
  adaptiveRender,
  stickyDate,
}: IChatViewContextOptions): IChatViewContextValue =>
  useMemo(
    () => ({
      theme,
      layout,
      inputBarLayout,
      features,
      styles,
      contentTypes,
      actions,
      highlight,
      adaptiveRender,
      stickyDate,
    }),
    [
      theme,
      layout,
      inputBarLayout,
      features,
      styles,
      contentTypes,
      actions,
      highlight,
      adaptiveRender,
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
  features: IInputBarFeatures,
): IInputBarContextValue =>
  useMemo(
    () => ({
      theme,
      layout,
      features: {
        showAttachButton: features.showAttachButton,
        showVoiceRecording: features.showVoiceRecording,
      },
      styles: createInputBarStyles(theme, layout),
    }),
    [theme, layout, features.showAttachButton, features.showVoiceRecording],
  );

import {
  CONTEXT_MENU_ACTION_SEPARATOR_HEIGHT,
  CONTEXT_MENU_EMOJI_PANEL_PADDING,
  IContextMenuTheme,
} from "../config";
import {
  IContextMenuInsets,
  IContextMenuRect,
  IContextMenuSize,
} from "../types";

/**
 * Раскладка меню: куда встают снапшот, панель
 * эмодзи и список действий относительно исходной вьюхи и границ экрана.
 * Чистая математика: ни React, ни анимаций.
 */

/** Масштаб, с которого панели «вырастают» при открытии. */
export const CONTEXT_MENU_PANEL_SCALE = 0.5;

export interface IContextMenuLayout {
  snapTarget: IContextMenuRect;

  emojiTarget: IContextMenuRect;

  actionsTarget: IContextMenuRect;
  snapOrigin: IContextMenuRect;
  emojiOrigin: IContextMenuRect;
  actionsOrigin: IContextMenuRect;
  canvasSize: IContextMenuSize;
  scrollOffset: number;
  needsScroll: boolean;
  hasEmoji: boolean;
  hasActions: boolean;
}

export interface IContextMenuLayoutInput {
  sourceFrame: IContextMenuRect;
  snapSize: IContextMenuSize;

  emojiSize: IContextMenuSize;

  actionsSize: IContextMenuSize;
  screen: IContextMenuSize;
  safeArea: IContextMenuInsets;
  theme: IContextMenuTheme;
}

const ZERO_RECT: IContextMenuRect = { x: 0, y: 0, width: 0, height: 0 };

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(v, hi));

export const emojiPanelPreferredSize = (
  emojiCount: number,
  theme: IContextMenuTheme,
): IContextMenuSize =>
  emojiCount > 0
    ? {
        width:
          emojiCount * theme.emojiItemSize +
          CONTEXT_MENU_EMOJI_PANEL_PADDING * 2,
        height: theme.emojiItemSize + CONTEXT_MENU_EMOJI_PANEL_PADDING * 2,
      }
    : { width: 0, height: 0 };

export const actionsPanelPreferredSize = (
  actionCount: number,
  theme: IContextMenuTheme,
): IContextMenuSize =>
  actionCount > 0
    ? {
        width: theme.menuWidth,
        height:
          actionCount * theme.actionItemHeight +
          Math.max(0, actionCount - 1) * CONTEXT_MENU_ACTION_SEPARATOR_HEIGHT,
      }
    : { width: 0, height: 0 };

export const calculateContextMenuLayout = ({
  sourceFrame,
  snapSize,
  emojiSize,
  actionsSize,
  screen,
  safeArea,
  theme,
}: IContextMenuLayoutInput): IContextMenuLayout => {
  const hasEmoji = emojiSize.height > 0;
  const hasActions = actionsSize.height > 0;

  const hPad = theme.horizontalPadding;
  const vPad = theme.verticalPadding;
  const eGap = hasEmoji ? theme.emojiPanelSpacing : 0;
  const mGap = hasActions ? theme.menuSpacing : 0;

  const snapW = snapSize.width;
  const snapH = snapSize.height;
  const emojiW = hasEmoji
    ? Math.min(emojiSize.width, screen.width - hPad * 2)
    : 0;
  const emojiH = hasEmoji ? emojiSize.height : 0;
  const menuW = hasActions
    ? Math.min(actionsSize.width, screen.width - hPad * 2)
    : 0;
  const menuH = hasActions ? actionsSize.height : 0;

  const topLimit = safeArea.top + vPad;
  const bottomLimit = screen.height - safeArea.bottom - vPad;

  const leftMargin = sourceFrame.x;
  const rightMargin = screen.width - sourceFrame.x - snapW;
  const marginDiff = rightMargin - leftMargin;
  const shift =
    Math.abs(marginDiff) < 1
      ? 0
      : clamp(marginDiff * 0.15, -theme.snapOpenShift, theme.snapOpenShift);
  const snapX = sourceFrame.x + shift;
  const emojiX = hasEmoji
    ? clamp(snapX + snapW - emojiW, hPad, screen.width - emojiW - hPad)
    : 0;
  const menuX = hasActions
    ? snapX + menuW > screen.width - hPad
      ? screen.width - hPad - menuW
      : snapX
    : 0;

  const totalH = emojiH + eGap + snapH + mGap + menuH;
  const needsScroll = totalH > bottomLimit - topLimit;

  let emojiYc: number;
  let snapYc: number;
  let menuYc: number;
  let canvasH: number;
  let scrollOffset: number;

  if (needsScroll) {
    emojiYc = topLimit;
    snapYc = emojiYc + emojiH + eGap;
    menuYc = snapYc + snapH + mGap;
    canvasH = menuYc + menuH + safeArea.bottom + vPad;
    scrollOffset = Math.max(0, canvasH - screen.height);
  } else {
    const blockTop = clamp(
      sourceFrame.y - emojiH - eGap,
      topLimit,
      bottomLimit - totalH,
    );

    emojiYc = blockTop;
    snapYc = emojiYc + emojiH + eGap;
    menuYc = snapYc + snapH + mGap;
    canvasH = screen.height;
    scrollOffset = 0;
  }

  const originY = sourceFrame.y + scrollOffset;

  return {
    snapTarget: { x: snapX, y: snapYc, width: snapW, height: snapH },
    emojiTarget: hasEmoji
      ? { x: emojiX, y: emojiYc, width: emojiW, height: emojiH }
      : ZERO_RECT,
    actionsTarget: hasActions
      ? { x: menuX, y: menuYc, width: menuW, height: menuH }
      : ZERO_RECT,
    snapOrigin: { x: sourceFrame.x, y: originY, width: snapW, height: snapH },
    emojiOrigin: hasEmoji
      ? { x: emojiX, y: originY - eGap - emojiH, width: emojiW, height: emojiH }
      : ZERO_RECT,
    actionsOrigin: hasActions
      ? { x: menuX, y: originY + snapH + mGap, width: menuW, height: menuH }
      : ZERO_RECT,
    canvasSize: { width: screen.width, height: canvasH },
    scrollOffset,
    needsScroll,
    hasEmoji,
    hasActions,
  };
};

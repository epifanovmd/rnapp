import { TextStyle, ViewStyle } from "react-native";

import { inputTextBase } from "../utils";
import { IInputBarFont, IInputBarLayout } from "./input-bar-layout";
import { IInputBarTheme } from "./input-bar-theme";

/**
 * Готовые стили панели ввода, собранные один раз на пару (тема, метрики) —
 * тот же приём, что в `chat-view/config`: компоненты ничего не считают в
 * рендере, а все визуальные константы лежат в одном месте.
 */

const font = (
  f: IInputBarFont,
  color: string,
  extra?: TextStyle,
): TextStyle => ({
  ...inputTextBase,
  fontSize: f.fontSize,
  fontWeight: f.fontWeight,
  color,
  ...(f.monospacedDigits ? { fontVariant: ["tabular-nums" as const] } : null),
  ...extra,
});

export interface IInputBarStyles {
  /** Ряд «вложение — поле — микрофон». */
  stack: ViewStyle;
  /** Круглая кнопка по краям панели. */
  roundButton: ViewStyle;
  /** Она же во время записи: залитая, без обводки. */
  roundButtonActive: ViewStyle;
  field: ViewStyle;
  textInput: TextStyle;
  sendButton: ViewStyle;

  replyWrap: ViewStyle;
  replyInner: ViewStyle;
  replyAccent: ViewStyle;
  replyIcon: ViewStyle;
  replyTexts: ViewStyle;
  replySender: TextStyle;
  replyText: TextStyle;
  replyClose: ViewStyle;
  replySeparator: ViewStyle;

  recordingRow: ViewStyle;
  recordingDot: ViewStyle;
  recordingTimer: TextStyle;
  recordingHintWrap: ViewStyle;
  recordingHintInner: ViewStyle;
  recordingHintText: TextStyle;

  lockBadge: ViewStyle;
  lockChevron: ViewStyle;
  lockIconShift: ViewStyle;
}

/** Насколько капсула замка выше своей ширины (порт `+ 14`). */
const LOCK_EXTRA_HEIGHT = 14;

export const createInputBarStyles = (
  t: IInputBarTheme,
  l: IInputBarLayout,
): IInputBarStyles => {
  const replySpacing = l.inputReplySpacing;
  const sendSize = l.textViewMinHeight - l.inputSendButtonInset * 2;

  return {
    stack: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: l.inputBarHPad,
      paddingVertical: l.inputBarVPad,
      gap: l.inputStackSpacing,
    },
    roundButton: {
      alignItems: "center",
      justifyContent: "center",
      width: l.inputButtonSize,
      height: l.inputButtonSize,
      borderRadius: l.inputButtonSize / 2,
      borderWidth: l.inputBorderWidth,
      borderColor: t.inputBorder,
      backgroundColor: t.inputBackground,
    },
    roundButtonActive: {
      borderWidth: 0,
      backgroundColor: t.inputRecordingMicFill,
    },
    field: {
      flex: 1,
      overflow: "visible",
      borderRadius: l.textViewCornerRadius,
      borderWidth: l.inputBorderWidth,
      borderColor: t.inputBorder,
      backgroundColor: t.inputBackground,
    },
    textInput: {
      ...inputTextBase,
      textAlignVertical: "center",
      paddingTop: l.textViewInsetTop,
      paddingBottom: l.textViewInsetBottom,
      // +5 — оптическая поправка к иконке вложения, порт отступа textContainer.
      paddingLeft: l.textViewInsetLeft + 5,
      paddingRight: l.textViewInsetRight,
      fontSize: l.textViewFont.fontSize,
      color: t.inputText,
    },
    sendButton: {
      alignItems: "center",
      justifyContent: "center",
      width: sendSize,
      height: sendSize,
      borderRadius: sendSize / 2,
      backgroundColor: t.inputRecordingMicFill,
    },

    replyWrap: { overflow: "hidden" },
    replyInner: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: replySpacing,
    },
    replyAccent: {
      alignSelf: "stretch",
      width: l.inputReplyAccentWidth,
      marginVertical: replySpacing - 2,
      backgroundColor: t.inputReplyAccent,
    },
    replyIcon: {
      alignItems: "center",
      justifyContent: "center",
      marginLeft: replySpacing - 2,
    },
    replyTexts: { flex: 1, marginLeft: replySpacing / 2 },
    replySender: font(l.inputReplySenderFont, t.inputReplySender),
    replyText: font(l.inputReplyTextFont, t.inputReplyText, { marginTop: 1 }),
    replyClose: {
      alignItems: "center",
      justifyContent: "center",
      width: l.inputReplyCancelSize,
      height: l.inputReplyCancelSize,
    },
    replySeparator: {
      height: l.inputSeparatorHeight,
      marginHorizontal: replySpacing,
      backgroundColor: t.inputBorder,
    },

    recordingRow: {
      flexDirection: "row",
      alignItems: "center",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      height: l.textViewMinHeight,
    },
    recordingDot: {
      marginLeft: l.recordDotLeading,
      width: l.recordDotSize,
      height: l.recordDotSize,
      borderRadius: l.recordDotSize / 2,
      backgroundColor: t.inputRecordingDot,
    },
    recordingTimer: font(l.recordTimerFont, t.inputText, {
      marginLeft: l.recordTimerLeading,
    }),
    recordingHintWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    recordingHintInner: { flexDirection: "row", alignItems: "center" },
    recordingHintText: font(l.recordCancelFont, t.inputPlaceholder, {
      marginLeft: 3,
    }),

    // Капсула, а не круг: в поде высота на 14 больше ширины, шеврон прижат
    // к верху, замок центрирован со смещением вниз.
    lockBadge: {
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "absolute",
      alignSelf: "center",
      bottom: l.inputButtonSize + l.recordLockBottomMargin,
      width: l.recordLockContainerSize,
      height: l.recordLockContainerSize + LOCK_EXTRA_HEIGHT,
      borderRadius: l.recordLockContainerSize / 2,
      backgroundColor: t.inputLockBackground,
    },
    lockChevron: { position: "absolute", top: l.recordLockChevronTopPad },
    lockIconShift: {
      transform: [{ translateY: l.recordLockIconCenterOffset }],
    },
  };
};

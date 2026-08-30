import { TextStyle, ViewStyle } from "react-native";

import { inputTextBase } from "../utils";
import { IInputBarColors, INPUT_BAR_COLORS } from "./input-bar-colors";

/**
 * Готовые стили панели ввода, собранные один раз на палитру. Метрики —
 * литералы: панель не конфигурируется снаружи.
 */

/** Круглые кнопки по краям панели. */
export const INPUT_BAR_BUTTON_SIZE = 40;

/** Поле ввода: одна строка и потолок до прокрутки. */
export const INPUT_BAR_FIELD_MIN_HEIGHT = 40;
export const INPUT_BAR_FIELD_MAX_HEIGHT = 120;

/** Вертикальные отступы ряда панели. */
const BAR_VERTICAL_PADDING = 8;

/**
 * Минимальная высота свёрнутой панели: поле плюс её вертикальные отступы.
 *
 * Считается из тех же метрик, что и раскладка: с неё начинается нижний отступ
 * контента, и разойдись она с настоящей высотой — отступ приехал бы ступенькой
 * сразу после первого замера.
 */
export const INPUT_BAR_MIN_HEIGHT =
  INPUT_BAR_FIELD_MIN_HEIGHT + BAR_VERTICAL_PADDING * 2;

/** Высота панели ответа/редактирования над полем. */
export const INPUT_BAR_REPLY_PANEL_HEIGHT = 48;

/** Отступ между элементами панели ответа. */
const REPLY_SPACING = 8;

/** Кнопка отправки утоплена внутрь поля. */
const SEND_INSET = 4;
const SEND_SIZE = INPUT_BAR_FIELD_MIN_HEIGHT - SEND_INSET * 2;

/** Насколько капсула замка выше своей ширины. */
const LOCK_EXTRA_HEIGHT = 14;
const LOCK_SIZE = 44;

const text = (
  fontSize: number,
  color: string,
  extra?: TextStyle,
): TextStyle => ({ ...inputTextBase, fontSize, color, ...extra });

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

const createInputBarStyles = (c: IInputBarColors): IInputBarStyles => ({
  stack: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: BAR_VERTICAL_PADDING,
    gap: 6,
  },
  roundButton: {
    alignItems: "center",
    justifyContent: "center",
    width: INPUT_BAR_BUTTON_SIZE,
    height: INPUT_BAR_BUTTON_SIZE,
    borderRadius: INPUT_BAR_BUTTON_SIZE / 2,
    borderWidth: 0.5,
    borderColor: c.inputBorder,
    backgroundColor: c.inputBackground,
  },
  roundButtonActive: {
    borderWidth: 0,
    backgroundColor: c.inputRecordingMicFill,
  },
  field: {
    flex: 1,
    overflow: "visible",
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: c.inputBorder,
    backgroundColor: c.inputBackground,
  },
  textInput: {
    ...inputTextBase,
    textAlignVertical: "center",
    paddingTop: 10,
    paddingBottom: 10,
    // +5 — оптическая поправка к иконке вложения.
    paddingLeft: 13,
    paddingRight: 40,
    fontSize: 16,
    color: c.inputText,
  },
  sendButton: {
    alignItems: "center",
    justifyContent: "center",
    width: SEND_SIZE,
    height: SEND_SIZE,
    borderRadius: SEND_SIZE / 2,
    backgroundColor: c.inputRecordingMicFill,
  },

  replyWrap: { overflow: "hidden" },
  replyInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: REPLY_SPACING,
  },
  replyAccent: {
    alignSelf: "stretch",
    width: 2.5,
    marginVertical: REPLY_SPACING - 2,
    backgroundColor: c.inputReplyAccent,
  },
  replyIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: REPLY_SPACING - 2,
  },
  replyTexts: { flex: 1, marginLeft: REPLY_SPACING / 2 },
  replySender: text(13, c.inputReplySender, { fontWeight: "600" }),
  replyText: text(13, c.inputReplyText, { marginTop: 1 }),
  replyClose: {
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
  },
  replySeparator: {
    height: 0.5,
    marginHorizontal: REPLY_SPACING,
    backgroundColor: c.inputBorder,
  },

  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: INPUT_BAR_FIELD_MIN_HEIGHT,
  },
  recordingDot: {
    marginLeft: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: c.inputRecordingDot,
  },
  recordingTimer: text(16, c.inputText, {
    fontVariant: ["tabular-nums"],
    marginLeft: 8,
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
  recordingHintText: text(14, c.inputPlaceholder, { marginLeft: 3 }),

  // Капсула, а не круг: высота на 14 больше ширины, шеврон прижат
  // к верху, замок центрирован со смещением вниз.
  lockBadge: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "absolute",
    alignSelf: "center",
    bottom: INPUT_BAR_BUTTON_SIZE + 8,
    width: LOCK_SIZE,
    height: LOCK_SIZE + LOCK_EXTRA_HEIGHT,
    borderRadius: LOCK_SIZE / 2,
    backgroundColor: c.inputLockBackground,
  },
  lockChevron: { position: "absolute", top: 6 },
  lockIconShift: { transform: [{ translateY: 5 }] },
});

/** Цвета и стили под каждую схему — собраны один раз на модуле. */
const INPUT_BAR_SKIN = {
  light: {
    colors: INPUT_BAR_COLORS.light,
    styles: createInputBarStyles(INPUT_BAR_COLORS.light),
  },
  dark: {
    colors: INPUT_BAR_COLORS.dark,
    styles: createInputBarStyles(INPUT_BAR_COLORS.dark),
  },
};

export type IInputBarSkin = (typeof INPUT_BAR_SKIN)["light"];

/** Палитра и стили панели по текущей схеме приложения. */
export const inputBarSkin = (isDark: boolean): IInputBarSkin =>
  isDark ? INPUT_BAR_SKIN.dark : INPUT_BAR_SKIN.light;

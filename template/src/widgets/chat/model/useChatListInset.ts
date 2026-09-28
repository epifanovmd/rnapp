import { IInputBarRef, useInputBarInset } from "@shared/ui/input-bar";
import { RefObject, useCallback, useMemo } from "react";
import { SharedValue } from "react-native-reanimated";

/**
 * Нижний отступ списка сообщений.
 *
 * `AnchorList` берёт одно значение `insetEnd` и от него сам делает всё, что
 * упирается в низ: распорку в конце контента, сдвиг короткого контента к концу,
 * подъём смещения под клавиатуру и отступ индикатора. Считать это здесь нечего
 * — здесь только собирается само перекрытие и связывается с панелью ввода.
 */

export interface IChatListInsetOptions {
  /** Панель ввода: её фокус гасится на время заморозки отступа. */
  inputBarRef: RefObject<IInputBarRef | null>;
}

export interface IChatListInset {
  /** В `AnchorList.insetEnd` — одно значение на весь низ списка. */
  insetEnd: SharedValue<number>;
  /** Подъём самой панели ввода: клавиатура, а без неё — safe area. */
  barOffset: SharedValue<number>;
  /**
   * Живое перекрытие для оверлеев над панелью: они едут с клавиатурой даже
   * когда отступ контента заморожен.
   */
  liveInset: SharedValue<number>;
  /**
   * То же для кнопки «вниз»: она садится у правого края, а панель ответа его
   * не занимает, пока поле не растянулось на всю ширину ряда.
   */
  edgeInset: SharedValue<number>;
  /** Поле ввода заняло всю ширину ряда: уходит в `InputBar.onFullWidthChange`. */
  setInputFullWidth: (isFullWidth: boolean) => void;
  /** Собственная высота панели: уходит в `InputBar.onHeightChange`. */
  setBarHeight: (height: number) => void;
  /** Заморозить отступ на время контекстного меню поверх списка. */
  freeze: () => void;
  restore: () => void;
}

export const useChatListInset = ({
  inputBarRef,
}: IChatListInsetOptions): IChatListInset => {
  // Меню снимает снимок сообщения в его текущей позиции: пока оно открыто,
  // список обязан стоять на месте, поэтому фокус уходит вместе с отступом.
  const blurInput = useCallback(
    () => inputBarRef.current?.blur(),
    [inputBarRef],
  );
  const refocusInput = useCallback(
    () => inputBarRef.current?.focus(),
    [inputBarRef],
  );

  const inset = useInputBarInset({
    onBlurInput: blurInput,
    onRefocusInput: refocusInput,
  });

  return useMemo(
    () => ({
      insetEnd: inset.contentInset,
      barOffset: inset.barOffset,
      liveInset: inset.liveInset,
      edgeInset: inset.edgeInset,
      setInputFullWidth: inset.setInputFullWidth,
      setBarHeight: inset.setBarHeight,
      freeze: inset.freeze,
      restore: inset.restore,
    }),
    [inset],
  );
};

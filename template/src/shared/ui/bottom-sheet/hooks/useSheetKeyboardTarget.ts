import { useBottomSheetInternal } from "@gorhom/bottom-sheet";
import { RefObject, useCallback, useEffect } from "react";
import { findNodeHandle, TextInput } from "react-native";

/** Событие фокуса поля: нужен только нативный тег цели. */
interface IFocusTargetEvent {
  nativeEvent: { target: number };
}

/**
 * Поле ввода внутри шторки — цель клавиатуры, как `BottomSheetTextInput`:
 * шторка поднимается над клавиатурой по фокусу любого поля кита. Вне
 * шторки обработчики ничего не делают.
 */
export const useSheetKeyboardTarget = (
  inputRef: RefObject<TextInput | null>,
) => {
  const sheet = useBottomSheetInternal(true);

  useEffect(() => {
    if (!sheet) return;

    const { textInputNodesRef, animatedKeyboardState } = sheet;
    const node = findNodeHandle(inputRef.current);

    if (!node) return;

    textInputNodesRef.current.add(node);

    return () => {
      if (animatedKeyboardState.get().target === node) {
        animatedKeyboardState.set(state => ({ ...state, target: undefined }));
      }
      textInputNodesRef.current.delete(node);
    };
  }, [sheet, inputRef]);

  const onFocus = useCallback(
    (event: IFocusTargetEvent) => {
      sheet?.animatedKeyboardState.set(state => ({
        ...state,
        target: event.nativeEvent.target,
      }));
    },
    [sheet],
  );

  const onBlur = useCallback(
    (event: IFocusTargetEvent) => {
      if (!sheet) return;

      const { animatedKeyboardState, textInputNodesRef } = sheet;
      const focused = findNodeHandle(
        TextInput.State.currentlyFocusedInput() as unknown as TextInput | null,
      );
      const isOwnTarget =
        animatedKeyboardState.get().target === event.nativeEvent.target;
      const focusStaysInSheet =
        !!focused && textInputNodesRef.current.has(focused);

      if (isOwnTarget && !focusStaysInSheet) {
        animatedKeyboardState.set(state => ({ ...state, target: undefined }));
      }
    },
    [sheet],
  );

  return { onFocus, onBlur };
};

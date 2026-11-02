import React, { ReactNode } from "react";

import { BottomSheet, useBottomSheetScrollGesture } from "../../bottom-sheet";
import { useSelectSheet } from "../hooks";
import type { SelectValue } from "../types";
import type { ISelectListModel } from "./select-list-model";
import { SelectSheetBody } from "./SelectSheetBody";

export interface ISelectSheetProps<V extends SelectValue> {
  visible: boolean;
  /** Шторку закрыли жестом, фоном или крестиком. */
  onUserDismiss: () => void;
  /** Шторка доехала до открытого положения. */
  onOpened?: () => void;
  title?: string;
  /** Шапка над списком: поиск или поле ввода. */
  top?: ReactNode;
  model: ISelectListModel<V>;
  /** Кнопка «Готово» в футере (multi). */
  onDone?: () => void;
  /** Кнопка «Очистить» в футере (multi clearable). */
  onClearAll?: () => void;
  maxHeight: number;
}

/** Шторка выбора поверх родительской (`nested`): заголовок, шапка, список. */
export const SelectSheet = <V extends SelectValue>({
  visible,
  onUserDismiss,
  onOpened,
  title,
  top,
  model,
  onDone,
  onClearAll,
  maxHeight,
}: ISelectSheetProps<V>) => {
  const { sheetRef, onDismiss } = useSelectSheet(visible, onUserDismiss);
  const gesture = useBottomSheetScrollGesture();

  return (
    <BottomSheet
      ref={sheetRef}
      nested
      dismissKeyboardOnOpen
      maxDynamicContentSize={maxHeight}
      simultaneousHandlers={model.virtual ? gesture : undefined}
      onDismiss={onDismiss}
      onChange={index => {
        if (index >= 0) onOpened?.();
      }}
    >
      <BottomSheet.Header label={title ?? "Выберите"} />
      <BottomSheet.Content>
        {contentProps => (
          <SelectSheetBody<V>
            model={model}
            top={top}
            contentProps={contentProps}
            gesture={gesture}
            maxHeight={maxHeight}
          />
        )}
      </BottomSheet.Content>
      {!!onDone && (
        <BottomSheet.Footer>
          {!!onClearAll && (
            <BottomSheet.Footer.SecondaryButton
              title={"Очистить"}
              onPress={onClearAll}
            />
          )}
          <BottomSheet.Footer.PrimaryButton title={"Готово"} onPress={onDone} />
        </BottomSheet.Footer>
      )}
    </BottomSheet>
  );
};

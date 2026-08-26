import React, { FC, memo, useMemo } from "react";
import { StyleSheet, TextInput } from "react-native";

import {
  INPUT_BAR_FIELD_MAX_HEIGHT,
  INPUT_BAR_FIELD_MIN_HEIGHT,
} from "../../config";
import { useInputBarSkin } from "../../hooks";

/** Плейсхолдер пустого поля. */
const PLACEHOLDER = "Сообщение";

interface IInputBarTextFieldProps {
  inputRef: React.RefObject<TextInput | null>;
  value: string;
  /** Поле накрыто строкой записи — прячем, не размонтируя. */
  hidden: boolean;
  onChangeText: (value: string) => void;
}

/**
 * Поле ввода. Растёт под текст: границы заданы `minHeight`/`maxHeight`,
 * содержимое прокручивается внутри. Явную высоту задавать нельзя —
 * `onContentSizeChange` замыкает петлю на минимуме, поле перестаёт расти.
 *
 * Во время записи остаётся в DOM с неизменными пропсами, чтобы не потерять
 * фокус и не пересоздать нативное поле ввода.
 */
export const InputBarTextField: FC<IInputBarTextFieldProps> = memo(
  ({ inputRef, value, hidden, onChangeText }) => {
    const { colors, styles } = useInputBarSkin();

    const style = useMemo(
      () => [styles.textInput, ss.bounds, hidden ? ss.hidden : null],
      [styles.textInput, hidden],
    );

    return (
      <TextInput
        ref={inputRef}
        multiline
        value={value}
        placeholder={PLACEHOLDER}
        placeholderTextColor={colors.inputPlaceholder}
        style={style}
        selectionColor={colors.inputTint}
        onChangeText={onChangeText}
      />
    );
  },
);

InputBarTextField.displayName = "InputBarTextField";

const ss = StyleSheet.create({
  bounds: {
    minHeight: INPUT_BAR_FIELD_MIN_HEIGHT,
    maxHeight: INPUT_BAR_FIELD_MAX_HEIGHT,
  },
  hidden: { opacity: 0 },
});

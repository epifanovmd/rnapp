import React, { FC, memo, useMemo } from "react";
import { TextInput } from "react-native";

import { useInputBarContext } from "../../config";

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
 * фокус и не вызвать пересоздание нативного UITextView.
 */
export const InputBarTextField: FC<IInputBarTextFieldProps> = memo(
  ({ inputRef, value, hidden, onChangeText }) => {
    const { theme, layout, styles } = useInputBarContext();

    const style = useMemo(
      () => [
        styles.textInput,
        {
          minHeight: layout.textViewMinHeight,
          maxHeight: layout.textViewMaxHeight,
          opacity: hidden ? 0 : 1,
        },
      ],
      [
        styles.textInput,
        layout.textViewMinHeight,
        layout.textViewMaxHeight,
        hidden,
      ],
    );

    return (
      <TextInput
        ref={inputRef}
        multiline
        value={value}
        placeholder={layout.inputPlaceholderText}
        placeholderTextColor={theme.inputPlaceholder}
        style={style}
        selectionColor={theme.inputTint}
        onChangeText={onChangeText}
      />
    );
  },
);

InputBarTextField.displayName = "InputBarTextField";

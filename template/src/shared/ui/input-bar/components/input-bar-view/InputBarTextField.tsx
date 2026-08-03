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
 * Поле ввода. Растёт под текст само: границы заданы `minHeight`/`maxHeight`,
 * дальше поле прокручивает содержимое внутри себя — как нативная панель.
 *
 * Явную высоту задавать нельзя: `contentSize` многострочного поля ограничен
 * его же фреймом, и высота, посчитанная из `onContentSizeChange`, замыкает
 * петлю на минимуме — поле перестаёт расти.
 *
 * Всегда смонтировано и с неизменными пропсами во время записи:
 * размонтирование увело бы фокус и закрыло клавиатуру, а смена пропсов может
 * заставить RN пересоздать нативный UITextView с тем же эффектом.
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

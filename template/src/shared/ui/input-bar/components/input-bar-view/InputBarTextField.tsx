import React, { FC, memo, useCallback, useMemo } from "react";
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputContentSizeChangeEventData,
} from "react-native";

import { useInputBarContext } from "../../config";

/**
 * Поле ввода. Всегда смонтировано и с неизменными пропсами во время записи:
 * размонтирование увело бы фокус и закрыло клавиатуру, а смена пропсов может
 * заставить RN пересоздать нативный UITextView с тем же эффектом.
 */

interface IInputBarTextFieldProps {
  inputRef: React.RefObject<TextInput | null>;
  value: string;
  /** Высота поля с учётом роста текста, уже ограниченная min/max. */
  height: number;
  /** Поле накрыто строкой записи — прячем, не размонтируя. */
  hidden: boolean;
  onChangeText: (value: string) => void;
  onContentHeightChange: (height: number) => void;
}

export const InputBarTextField: FC<IInputBarTextFieldProps> = memo(
  ({
    inputRef,
    value,
    height,
    hidden,
    onChangeText,
    onContentHeightChange,
  }) => {
    const { theme, layout, styles } = useInputBarContext();

    const style = useMemo(
      () => [styles.textInput, { height, opacity: hidden ? 0 : 1 }],
      [styles.textInput, height, hidden],
    );

    const handleContentSizeChange = useCallback(
      (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) =>
        onContentHeightChange(e.nativeEvent.contentSize.height),
      [onContentHeightChange],
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
        onContentSizeChange={handleContentSizeChange}
      />
    );
  },
);

InputBarTextField.displayName = "InputBarTextField";

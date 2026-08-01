import { useEffect, useRef } from "react";
import { TextInput } from "react-native";

import { InputBarMode } from "../model/input-bar-types";

/**
 * Реакция на смену режима reply/edit: фокус, текст, сброс.
 */
export function useInputModeController(
  mode: InputBarMode,
  setText: (text: string) => void,
  onChangeText: (text: string) => void,
  inputRef: React.RefObject<TextInput | null>,
) {
  const prevModeType = useRef<InputBarMode["type"]>("normal");

  useEffect(() => {
    if (mode.type === "edit") {
      setText(mode.text);
      onChangeText(mode.text);
      inputRef.current?.focus();
    } else if (mode.type === "reply") {
      inputRef.current?.focus();
    } else if (prevModeType.current === "edit") {
      setText("");
      onChangeText("");
    }
    prevModeType.current = mode.type;
  }, [mode, setText, onChangeText, inputRef]);
}

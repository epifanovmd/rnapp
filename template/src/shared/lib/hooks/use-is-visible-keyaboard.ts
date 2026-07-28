import { useEffect } from "react";
import { Keyboard } from "react-native";

import { useBoolean } from "./use-boolean";

export const useIsVisibleKeyboard = () => {
  const [visible, setVisible, setHide] = useBoolean();

  useEffect(() => {
    const listenerShow = Keyboard.addListener("keyboardWillShow", setVisible);
    const listenerHide = Keyboard.addListener("keyboardDidHide", setHide);

    return () => {
      listenerShow.remove();
      listenerHide.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return visible;
};

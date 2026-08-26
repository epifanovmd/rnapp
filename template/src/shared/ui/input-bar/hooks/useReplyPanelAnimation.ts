import { useEffect, useRef } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { INPUT_BAR_REPLY_PANEL_HEIGHT } from "../config";
import { InputBarMode } from "../model";

interface IReplyContent {
  sender: string;
  text: string;
  isEdit: boolean;
}

/**
 * Анимация появления/скрытия панели ответа.
 * Содержимое замораживается на время анимации скрытия.
 */
export function useReplyPanelAnimation(mode: InputBarMode) {
  const isVisible = mode.type !== "normal";
  const height = useSharedValue(0);
  const lastContent = useRef<IReplyContent>({
    sender: "",
    text: "",
    isEdit: false,
  });

  if (mode.type === "reply") {
    lastContent.current = {
      sender: mode.senderName ?? "Сообщение",
      text: mode.text ?? mode.preview ?? (mode.hasImage ? "📷 Фото" : "…"),
      isEdit: false,
    };
  } else if (mode.type === "edit") {
    lastContent.current = {
      sender: "Редактирование",
      text: mode.text,
      isEdit: true,
    };
  }

  const targetHeight = isVisible ? INPUT_BAR_REPLY_PANEL_HEIGHT : 0;

  useEffect(() => {
    height.value = withTiming(targetHeight, {
      duration: targetHeight > 0 ? 250 : 200,
      easing:
        targetHeight > 0 ? Easing.out(Easing.ease) : Easing.in(Easing.ease),
    });
  }, [targetHeight, height]);

  const panelHeight = INPUT_BAR_REPLY_PANEL_HEIGHT;

  const wrapStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: Math.min(1, height.value / Math.max(panelHeight, 1)),
  }));

  return { content: lastContent.current, wrapStyle, panelHeight };
}

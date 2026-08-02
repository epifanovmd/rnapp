import React, { FC, memo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { useInputBarContext } from "../config";
import { useReplyPanelAnimation } from "../hooks";
import { InputBarMode } from "../model";
import { InputIcon } from "./InputIcon";

/**
 * Панель ответа/редактирования: акцентная полоска,
 * иконка режима, автор, текст и кнопка закрытия.
 */

interface IInputReplyPanelProps {
  mode: InputBarMode;
  onClose: () => void;
}

export const InputReplyPanel: FC<IInputReplyPanelProps> = memo(
  ({ mode, onClose }) => {
    const { theme, layout, styles } = useInputBarContext();

    const { content, wrapStyle } = useReplyPanelAnimation(mode);

    return (
      <Animated.View style={[styles.replyWrap, wrapStyle]}>
        <View style={styles.replyInner}>
          <View style={styles.replyAccent} />
          <View style={styles.replyIcon}>
            <InputIcon
              name={content.isEdit ? "pencil" : "arrowshape.turn.up.left.fill"}
              size={layout.inputReplyIconSize + 2}
              color={theme.inputReplyAccent}
            />
          </View>
          <View style={styles.replyTexts}>
            <Text numberOfLines={1} style={styles.replySender}>
              {content.sender}
            </Text>
            <Text numberOfLines={1} style={styles.replyText}>
              {content.text}
            </Text>
          </View>
          <Pressable hitSlop={8} style={styles.replyClose} onPress={onClose}>
            <InputIcon
              name="xmark"
              size={layout.inputReplyCancelIconSize + 2}
              color={theme.inputReplyClose}
              strokeWidth={3}
            />
          </Pressable>
        </View>
        <View style={styles.replySeparator} />
      </Animated.View>
    );
  },
);

InputReplyPanel.displayName = "InputReplyPanel";

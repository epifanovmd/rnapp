import React, { FC, memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { useReplyPanelAnimation } from "../hooks/useReplyPanelAnimation";
import { useInputBarContext } from "../model/input-bar-context";
import { InputBarMode } from "../model/input-bar-types";
import { inputTextBase } from "../model/text-style";
import { InputIcon } from "./InputIcon";

/**
 * Порт InputBarReplyPanel: панель ответа/редактирования с акцентной полоской,
 * иконкой, автором, текстом и кнопкой закрытия.
 */

interface IInputReplyPanelProps {
  mode: InputBarMode;
  onClose: () => void;
}

export const InputReplyPanel: FC<IInputReplyPanelProps> = memo(
  ({ mode, onClose }) => {
    const { theme, layout } = useInputBarContext();

    const { content, wrapStyle } = useReplyPanelAnimation(mode);

    const sp = layout.inputReplySpacing;

    return (
      <Animated.View style={[ss.wrap, wrapStyle]}>
        <View style={[ss.inner, { paddingHorizontal: sp }]}>
          <View
            style={[
              ss.accent,
              {
                width: layout.inputReplyAccentWidth,
                marginVertical: sp - 2,
                backgroundColor: theme.inputReplyAccent,
              },
            ]}
          />
          <View style={[ss.icon, { marginLeft: sp - 2 }]}>
            <InputIcon
              name={content.isEdit ? "pencil" : "arrowshape.turn.up.left.fill"}
              size={layout.inputReplyIconSize + 2}
              color={theme.inputReplyAccent}
            />
          </View>
          <View style={[ss.texts, { marginLeft: sp / 2 }]}>
            <Text
              numberOfLines={1}
              style={[
                inputTextBase,
                {
                  fontSize: layout.inputReplySenderFont.fontSize,
                  fontWeight: layout.inputReplySenderFont.fontWeight,
                  color: theme.inputReplySender,
                },
              ]}
            >
              {content.sender}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                inputTextBase,
                ss.replyText,
                {
                  fontSize: layout.inputReplyTextFont.fontSize,
                  fontWeight: layout.inputReplyTextFont.fontWeight,
                  color: theme.inputReplyText,
                },
              ]}
            >
              {content.text}
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            style={[
              ss.close,
              {
                width: layout.inputReplyCancelSize,
                height: layout.inputReplyCancelSize,
              },
            ]}
            onPress={onClose}
          >
            <InputIcon
              name="xmark"
              size={layout.inputReplyCancelIconSize + 2}
              color={theme.inputReplyClose}
              strokeWidth={3}
            />
          </Pressable>
        </View>
        <View
          style={{
            height: layout.inputSeparatorHeight,
            marginHorizontal: sp,
            backgroundColor: theme.inputBorder,
          }}
        />
      </Animated.View>
    );
  },
);

InputReplyPanel.displayName = "InputReplyPanel";

const ss = StyleSheet.create({
  accent: { alignSelf: "stretch" },
  replyText: { marginTop: 1 },
  close: { alignItems: "center", justifyContent: "center" },
  wrap: { overflow: "hidden" },
  inner: { flex: 1, flexDirection: "row", alignItems: "center" },
  icon: { alignItems: "center", justifyContent: "center" },
  texts: { flex: 1 },
});

import React, { FC, memo, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useChatViewContext } from "../chat-view/components/chat-view-context";
import { ChatIcon } from "../chat-view/components/ChatIcon";
import { chatTextBase } from "../chat-view/model";
import { ChatInputMode } from "./input-bar-types";

/**
 * Порт InputBarReplyPanel: панель ответа/редактирования с акцентной полоской,
 * иконкой, автором, текстом и кнопкой закрытия; высота анимируется 0.25s/0.2s.
 */

interface IInputReplyPanelProps {
  mode: ChatInputMode;
  onClose: () => void;
}

export const InputReplyPanel: FC<IInputReplyPanelProps> = memo(
  ({ mode, onClose }) => {
    const { theme, layout } = useChatViewContext();

    const isVisible = mode.type !== "normal";
    const height = useSharedValue(0);
    // Содержимое замораживается на время анимации скрытия — иначе панель
    // схлопывается уже пустой.
    const lastContent = useRef({ sender: "", text: "", isEdit: false });

    if (mode.type === "reply") {
      lastContent.current = {
        sender: mode.senderName ?? "Сообщение",
        text: mode.text ?? (mode.hasImage ? "📷 Photo" : "…"),
        isEdit: false,
      };
    } else if (mode.type === "edit") {
      lastContent.current = {
        sender: "Редактирование",
        text: mode.text,
        isEdit: true,
      };
    }

    const targetHeight = isVisible ? layout.inputReplyPanelHeight : 0;

    useEffect(() => {
      height.value = withTiming(targetHeight, {
        duration: targetHeight > 0 ? 250 : 200,
        easing:
          targetHeight > 0 ? Easing.out(Easing.ease) : Easing.in(Easing.ease),
      });
    }, [targetHeight, height]);

    const panelHeight = layout.inputReplyPanelHeight;

    const wrapStyle = useAnimatedStyle(() => ({
      height: height.value,
      opacity: Math.min(1, height.value / Math.max(panelHeight, 1)),
    }));

    const content = lastContent.current;
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
            <ChatIcon
              name={content.isEdit ? "pencil" : "arrowshape.turn.up.left.fill"}
              size={layout.inputReplyIconSize + 2}
              color={theme.inputReplyAccent}
            />
          </View>
          <View style={[ss.texts, { marginLeft: sp / 2 }]}>
            <Text
              numberOfLines={1}
              style={[
                chatTextBase,
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
                chatTextBase,
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
            <ChatIcon
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
  accent: {
    alignSelf: "stretch",
  },
  replyText: {
    marginTop: 1,
  },
  close: {
    alignItems: "center",
    justifyContent: "center",
  },
  wrap: {
    overflow: "hidden",
  },
  inner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    flex: 1,
  },
});

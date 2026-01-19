import React, { forwardRef, useImperativeHandle, useRef } from "react";
import {
  findNodeHandle,
  NativeModules,
  NativeSyntheticEvent,
  requireNativeComponent,
} from "react-native";

import { ChatRef, ChatViewProps, ScrollEvent } from "./types";

const NATIVE_COMPONENT_NAME = "ChatView";
const NativeChatView = requireNativeComponent<any>(NATIVE_COMPONENT_NAME);
const ChatModule = NativeModules.ChatViewManager;

export const ChatViewNative = forwardRef<ChatRef, ChatViewProps>(
  (props, ref) => {
    const nativeRef = useRef(null);

    const dispatchCommand = (commandName: string, args: any[]) => {
      const node = findNodeHandle(nativeRef.current);

      if (!node) return;

      if (ChatModule && ChatModule[commandName]) {
        ChatModule[commandName](node, ...args);
      }
    };

    useImperativeHandle(ref, () => ({
      appendMessages: messages => dispatchCommand("appendMessages", [messages]),
      deleteMessage: id => dispatchCommand("deleteMessage", [id]),
      markAsRead: ids => dispatchCommand("markMessagesAsRead", [ids]),
      setTyping: isTyping => dispatchCommand("setTyping", [isTyping]),

      scrollToBottom: animated => dispatchCommand("scrollToBottom", [animated]),

      scrollToMessage: (messageId, animated) =>
        dispatchCommand("scrollToMessage", [messageId, animated]),

      scrollToIndex: (index, animated) =>
        dispatchCommand("scrollToIndex", [index, animated]),

      scrollToOffset: (offset, animated) =>
        dispatchCommand("scrollToOffset", [offset, animated]),

      scrollToDate: (timestamp, animated) =>
        dispatchCommand("scrollToDate", [timestamp, animated]),
    }));

    return (
      <NativeChatView
        ref={nativeRef}
        {...props}
        style={[{ flex: 1 }, props.style]}
        // Мапим события жизненного цикла сообщений
        onVisibleMessages={(
          e: NativeSyntheticEvent<{ messageIds: string[] }>,
        ) => {
          props.onVisibleMessages?.(e.nativeEvent.messageIds);
        }}
        onLoadPreviousMessages={() => {
          props.onLoadPreviousMessages?.();
        }}
        onDeleteMessage={(e: NativeSyntheticEvent<{ messageId: string }>) => {
          props.onDelete?.(e.nativeEvent.messageId);
        }}
        // Мапим события скролла
        onScroll={(e: NativeSyntheticEvent<ScrollEvent>) => {
          props.onScroll?.(e.nativeEvent);
        }}
        onScrollBeginDrag={() => {
          props.onScrollBeginDrag?.();
        }}
        onScrollEndDrag={() => {
          props.onScrollEndDrag?.();
        }}
        onMomentumScrollEnd={() => {
          props.onMomentumScrollEnd?.();
        }}
        onScrollAnimationEnd={() => {
          props.onScrollAnimationEnd?.();
        }}
      />
    );
  },
);

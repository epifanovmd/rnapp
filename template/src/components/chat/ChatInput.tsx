import React, { forwardRef, memo, useMemo } from "react";
import { Platform, StyleSheet, TextInput, TextInputProps } from "react-native";

import { useChatTheme } from "./ChatThemeProvider";

export interface ChatInputProps extends Omit<TextInputProps, "editable"> {
  text?: string;
  maxInputHeight?: number;
  disable?: boolean;
}

export const ChatInput = memo(
  forwardRef<TextInput, ChatInputProps>(
    (
      {
        text = "",
        maxInputHeight = 166,
        disable = false,
        multiline = true,
        placeholder = "Type a message...",
        style,
        ...rest
      },
      ref,
    ) => {
      const theme = useChatTheme();

      const _style = useMemo(
        () => [
          styles.textInput,
          style,
          {
            maxHeight: maxInputHeight,
            backgroundColor: theme.toolbarInputBackground,
            color: theme.toolbarInputColor,
          },
        ],
        [
          maxInputHeight,
          style,
          theme.toolbarInputBackground,
          theme.toolbarInputColor,
        ],
      );

      return (
        <TextInput
          ref={ref}
          value={text}
          multiline={multiline}
          placeholder={placeholder}
          placeholderTextColor={theme.toolbarPlaceholderTextColor}
          editable={!disable}
          style={_style}
          enablesReturnKeyAutomatically
          underlineColorAndroid="transparent"
          {...rest}
        />
      );
    },
  ),
);

const styles = StyleSheet.create({
  textInput: {
    overflow: "hidden",
    flex: 1,
    marginRight: 8,
    marginLeft: 8,
    marginTop: 8,
    marginBottom: 8,
    padding: 8,
    paddingTop: Platform.select({
      ios: 8,
      android: 2,
    }),
    paddingBottom: Platform.select({
      ios: 8,
      android: 2,
    }),
    paddingLeft: 8,
    paddingRight: 8,
    color: "#fff",
    fontSize: Platform.select({
      ios: 16,
      android: 14,
    }),
    borderRadius: 16,
  },
});

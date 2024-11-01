import React, { forwardRef, memo, useMemo } from "react";
import {
  Insets,
  Platform,
  StatusBar,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from "react-native";

import { AttachButton, attachButtonProps } from "./AttachButton";
import { ChatInput, ChatInputProps } from "./ChatInput";
import { useChatTheme } from "./ChatThemeProvider";
import { SendButton, SendButtonProps } from "./SendButton";

export interface InputToolbarProps {
  insets?: Insets;
  containerStyle?: StyleProp<ViewStyle>;

  inputProps?: ChatInputProps;
  attachButtonProps?: attachButtonProps;
  sendButtonProps?: SendButtonProps;

  onPressAttachButton?: () => void;

  renderInput?: (
    props: ChatInputProps,
    ref?: React.Ref<TextInput>,
  ) => React.ReactNode;
  renderActionButton?: (props: attachButtonProps) => React.JSX.Element | null;
  renderSendButton?: (props: SendButtonProps) => React.JSX.Element | null;
  renderRecordVoice?: () => React.JSX.Element | null;
}

export const InputToolbar = memo(
  forwardRef<TextInput, InputToolbarProps>(
    (
      {
        insets,
        containerStyle,
        inputProps,
        attachButtonProps,
        sendButtonProps,
        onPressAttachButton,
        renderInput,
        renderActionButton,
        renderSendButton,
        renderRecordVoice,
      },
      ref,
    ) => {
      const theme = useChatTheme();

      const style = useMemo(
        () => [
          styles.container,
          containerStyle,
          {
            backgroundColor: theme.toolbarBackground,
            paddingBottom: Platform.select({
              ios: insets?.bottom,
              android: StatusBar.currentHeight,
            }),
            paddingRight: insets?.right,
            paddingLeft: insets?.left,
          },
        ],
        [
          containerStyle,
          insets?.bottom,
          insets?.left,
          insets?.right,
          theme.toolbarBackground,
        ],
      );

      return (
        <View style={style}>
          {renderActionButton?.({ ...attachButtonProps }) ||
            (onPressAttachButton && (
              <AttachButton
                onPressAttachButton={onPressAttachButton}
                {...attachButtonProps}
              />
            ))}
          {renderInput?.({ ...inputProps }, ref) || (
            <ChatInput ref={ref} {...inputProps} />
          )}
          {renderRecordVoice?.()}
          {renderSendButton?.({ ...sendButtonProps }) || (
            <SendButton {...sendButtonProps} />
          )}
        </View>
      );
    },
  ),
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
});

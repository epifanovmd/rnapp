import * as React from "react";
import { FC, memo, ReactNode, useCallback } from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { useChatTheme } from "./ChatThemeProvider";
import { IMessage } from "./types";

export interface SendButtonProps {
  text?: string;
  containerStyle?: StyleProp<ViewStyle>;
  icon?: (fill: string) => ReactNode;
  alwaysShowSend?: boolean;
  disabled?: boolean;

  onSend?: (
    messages: Partial<IMessage>,
    shouldResetInputToolbar: boolean,
  ) => void;
}

export const SendButton: FC<SendButtonProps> = memo(
  ({
    text = "",
    containerStyle,
    icon,
    alwaysShowSend = false,
    disabled = false,
    onSend,
  }) => {
    const theme = useChatTheme();

    const handleOnPress = useCallback(() => {
      if (text && onSend) {
        onSend({ text: text.trim() } as Partial<IMessage>, true);
      }
    }, [text, onSend]);

    const showSend = alwaysShowSend || !!(text && text.trim().length > 0);

    const renderIcon = useCallback(() => {
      if (icon) {
        return icon(theme.toolbarSendIconFill);
      }

      return (
        <Svg
          height={24}
          width={24}
          viewBox="0 0 24 24"
          fill={theme.toolbarSendIconFill}
        >
          <Path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
        </Svg>
      );
    }, [icon, theme.toolbarSendIconFill]);

    if (!showSend) {
      return null;
    }

    return (
      <TouchableOpacity
        style={[styles.container, containerStyle]}
        onPress={handleOnPress}
        disabled={disabled}
      >
        {renderIcon()}
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});

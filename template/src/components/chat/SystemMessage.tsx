import React, { FC, memo } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { useChatTheme } from "./ChatThemeProvider";
import { IMessage } from "./types";

export interface SystemMessageProps {
  currentMessage?: IMessage;
  containerStyle?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const SystemMessage: FC<SystemMessageProps> = memo(
  ({ currentMessage, containerStyle, wrapperStyle, textStyle }) => {
    const theme = useChatTheme();

    if (!currentMessage || !currentMessage.system) {
      return null;
    }

    return (
      <View style={[styles.container, containerStyle]}>
        <View style={wrapperStyle}>
          <Text
            style={[
              styles.text,
              {
                color: theme.systemMessageColor,
                backgroundColor: theme.systemMessageBackground,
              },
              textStyle,
            ]}
          >
            {currentMessage.text}
          </Text>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginTop: 5,
    marginBottom: 10,
    marginLeft: 52,
    marginRight: 52,
  },
  text: {
    fontSize: 14,
    fontWeight: "400",
    padding: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
});

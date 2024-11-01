import dayjs from "dayjs";
import * as React from "react";
import { memo } from "react";
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
import { isSameDay } from "./utils";

export interface DayProps {
  dateFormat?: string;
  currentMessage?: IMessage;
  previousMessage?: IMessage;
  containerStyle?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Day = memo(
  ({
    dateFormat = "ll",
    currentMessage,
    previousMessage,
    containerStyle,
    wrapperStyle,
    textStyle,
  }: DayProps) => {
    const theme = useChatTheme();

    if (currentMessage == null || isSameDay(currentMessage, previousMessage)) {
      return null;
    }

    return (
      <View style={[styles.container, containerStyle]}>
        <View style={wrapperStyle}>
          <Text
            style={[
              styles.text,
              {
                color: theme.dateColor,
                backgroundColor: theme.dateBackground,
              },
              textStyle,
            ]}
          >
            {dayjs(currentMessage.createdAt).format(dateFormat)}
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
    marginTop: 5,
    marginBottom: 10,
    marginLeft: 52,
    marginRight: 52,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    padding: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
});

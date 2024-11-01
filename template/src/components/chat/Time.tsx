import dayjs from "dayjs";
import * as React from "react";
import { FC, memo } from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

import { useChatTheme } from "./ChatThemeProvider";
import { IMessage, LeftRightStyle } from "./types";

export interface TimeProps {
  position?: "left" | "right";
  currentMessage?: IMessage;
  containerStyle?: LeftRightStyle<ViewStyle>;
  timeTextStyle?: LeftRightStyle<TextStyle>;
  timeFormat?: string;
}

export const Time: FC<TimeProps> = memo(
  ({
    position = "left",
    containerStyle,
    currentMessage,
    timeFormat = "HH:mm",
    timeTextStyle,
  }) => {
    const theme = useChatTheme();

    if (!currentMessage) {
      return null;
    }

    return (
      <View
        style={[
          styles[position].container,
          containerStyle && containerStyle[position],
        ]}
      >
        <Text
          style={[
            styles[position].text,
            {
              color:
                theme[`${position}TimeColor`] ??
                theme[`${position}BubbleInfoColor`],
            },
            timeTextStyle && timeTextStyle[position],
          ]}
        >
          {dayjs(currentMessage.createdAt).format(timeFormat)}
        </Text>
      </View>
    );
  },
);

const container = StyleSheet.create({
  containerStyle: {
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 5,
  },
});
const text = StyleSheet.create({
  textStyle: {
    fontSize: 10,
    backgroundColor: "transparent",
    textAlign: "right",
  },
});

const styles = {
  left: StyleSheet.create({
    container: container.containerStyle,
    text: text.textStyle,
  }),
  right: StyleSheet.create({
    container: container.containerStyle,
    text: text.textStyle,
  }),
};

import React, { memo, useCallback, useMemo } from "react";
import {
  Linking,
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import ParsedText, { ParsedTextProps } from "react-native-parsed-text";

import { useChatTheme } from "./ChatThemeProvider";
import { error } from "./logging";
import { IMessage, LeftRightStyle } from "./types";

const WWW_URL_PATTERN = /^www\./i;

export interface MessageTextProps {
  position?: "left" | "right";
  currentMessage?: IMessage;
  containerStyle?: LeftRightStyle<ViewStyle>;
  textStyle?: LeftRightStyle<TextStyle>;
  linkStyle?: LeftRightStyle<TextStyle>;
  textProps?: TextProps;
  customTextStyle?: StyleProp<TextStyle>;
  parsePatterns?: (linkStyle: StyleProp<TextStyle>) => ParsedTextProps["parse"];
  numberOfLines?: number;
}

const onUrlPress = (url: string) => {
  const formattedUrl = WWW_URL_PATTERN.test(url) ? `https://${url}` : url;

  Linking.openURL(formattedUrl).catch(e =>
    error(e, "No handler for URL:", formattedUrl),
  );
};

const onPhonePress = (phone: string) => {
  Linking.openURL(`tel:${phone}`).catch(e => {
    error(e, "No handler for telephone");
  });
};

const onEmailPress = (email: string) =>
  Linking.openURL(`mailto:${email}`).catch(e =>
    error(e, "No handler for mailto"),
  );

export const MessageText = memo(
  ({
    currentMessage,
    position = "left",
    containerStyle,
    textStyle,
    linkStyle: linkStyleProp,
    customTextStyle,
    parsePatterns,
    textProps,
    numberOfLines,
  }: MessageTextProps) => {
    const theme = useChatTheme();

    const linkStyle: StyleProp<TextStyle> = useMemo(
      () => [styles[position].link, linkStyleProp && linkStyleProp[position]],
      [linkStyleProp, position],
    );

    const parse = useMemo<ParsedTextProps["parse"]>(
      () => [
        { type: "url", style: linkStyle, onPress: onUrlPress },
        { type: "phone", style: linkStyle, onPress: onPhonePress },
        { type: "email", style: linkStyle, onPress: onEmailPress },
        ...(parsePatterns?.(linkStyle) || []),
      ],
      [linkStyle, parsePatterns],
    );

    const wrapStyle = [
      styles[position].container,
      containerStyle && containerStyle[position],
    ];

    const parseTextStyle = [
      styles[position].text,
      textStyle && textStyle[position],
      { color: theme[`${position}TextColor`] },
      customTextStyle,
    ];

    return (
      <View style={wrapStyle}>
        <ParsedText
          ellipsizeMode={"tail"}
          style={parseTextStyle}
          numberOfLines={numberOfLines}
          parse={parse}
          childrenProps={{ ...textProps }}
        >
          {currentMessage?.text}
        </ParsedText>
      </View>
    );
  },
);

const { textStyle } = StyleSheet.create({
  textStyle: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 10,
    marginRight: 10,
  },
});

const styles = {
  left: StyleSheet.create({
    container: {},
    text: textStyle,
    link: {
      textDecorationLine: "underline",
    },
  }),
  right: StyleSheet.create({
    container: {},
    text: textStyle,
    link: {
      textDecorationLine: "underline",
    },
  }),
};

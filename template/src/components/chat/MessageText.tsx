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

    const onUrlPress = useCallback((url: string) => {
      // When someone sends a message that includes a website address beginning with "www." (omitting the scheme),
      // react-native-parsed-text recognizes it as a valid url, but Linking fails to open due to the missing scheme.
      if (WWW_URL_PATTERN.test(url)) {
        onUrlPress(`https://${url}`);
      } else {
        Linking.openURL(url).catch(e => {
          error(e, "No handler for URL:", url);
        });
      }
    }, []);

    const onPhonePress = useCallback((phone: string) => {
      Linking.openURL(`tel:${phone}`).catch(e => {
        error(e, "No handler for telephone");
      });
    }, []);

    const onEmailPress = useCallback(
      (email: string) =>
        Linking.openURL(`mailto:${email}`).catch(e =>
          error(e, "No handler for mailto"),
        ),
      [],
    );

    const linkStyle: StyleProp<TextStyle> = useMemo(
      () => [styles[position].link, linkStyleProp && linkStyleProp[position]],
      [linkStyleProp, position],
    );

    const parse = useMemo<ParsedTextProps["parse"]>(
      () => [
        {
          type: "url",
          style: linkStyle,
          onPress: onUrlPress,
        },
        {
          type: "phone",
          style: linkStyle,
          onPress: onPhonePress,
        },
        {
          type: "email",
          style: linkStyle,
          onPress: onEmailPress,
        },
        ...(parsePatterns?.(linkStyle) || []),
      ],
      [linkStyle, onEmailPress, onPhonePress, onUrlPress, parsePatterns],
    );

    const wrapStyle = useMemo(
      () => [
        styles[position].container,
        containerStyle && containerStyle[position],
      ],
      [containerStyle, position],
    );

    const parseTextStyle = useMemo(
      () => [
        styles[position].text,
        textStyle && textStyle[position],
        { color: theme[`${position}TextColor`] },
        customTextStyle,
      ],
      [customTextStyle, position, textStyle, theme],
    );

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

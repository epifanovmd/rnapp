import React, { FC, memo } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { useChatTheme } from "./ChatThemeProvider";

export interface LoadEarlierProps {
  label?: string;
  isLoadingEarlier?: boolean;
  activityIndicatorSize?: number | "small" | "large";

  // Styles
  activityIndicatorStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;

  // Handlers
  onLoadEarlier?: () => void;
}

export const LoadEarlier: FC<LoadEarlierProps> = memo(
  ({
    label = "Load earlier messages",
    isLoadingEarlier = false,
    activityIndicatorSize = "small",
    activityIndicatorStyle,
    containerStyle,
    wrapperStyle,
    textStyle,
    onLoadEarlier,
  }) => {
    const theme = useChatTheme();

    return (
      <TouchableOpacity
        style={[styles.container, containerStyle]}
        onPress={onLoadEarlier}
        disabled={isLoadingEarlier}
        accessibilityRole="button"
      >
        <View
          style={[
            styles.wrapper,
            { backgroundColor: theme.loadEarlierBackground },
            wrapperStyle,
          ]}
        >
          {isLoadingEarlier ? (
            <View>
              <Text style={[styles.text, textStyle, { opacity: 0 }]}>
                {label}
              </Text>
              <ActivityIndicator
                color={theme.loadEarlierColor}
                size={activityIndicatorSize!}
                style={[styles.activityIndicator, activityIndicatorStyle]}
              />
            </View>
          ) : (
            <Text
              style={[
                styles.text,
                textStyle,
                { color: theme.loadEarlierColor },
              ]}
            >
              {label}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 5,
    marginBottom: 10,
  },
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    height: 30,
    paddingLeft: 10,
    paddingRight: 10,
  },
  text: {
    fontSize: 12,
  },
  activityIndicator: {
    marginTop: Platform.select({
      ios: -14,
      android: -16,
      default: -15,
    }),
  },
});

import React, { FC, memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  CONTEXT_MENU_EASING,
  IContextMenuStyles,
  IContextMenuTheme,
} from "../../config";
import { ContextMenuAction } from "../../types";
import { SfSymbolIcon } from "../SfSymbolIcon";

/** Пункт меню: подсветка на нажатии, иконка SF Symbol и заголовок. */

interface IActionRowProps {
  action: ContextMenuAction;
  theme: IContextMenuTheme;
  styles: IContextMenuStyles;
  onTap: (action: ContextMenuAction) => void;
}

export const ActionRow: FC<IActionRowProps> = memo(
  ({ action, theme, styles, onTap }) => {
    const highlight = useSharedValue(0);

    const handlePressIn = useCallback(() => {
      highlight.value = withTiming(1, {
        duration: 80,
        easing: CONTEXT_MENU_EASING,
      });
    }, [highlight]);

    const handlePressOut = useCallback(() => {
      highlight.value = withTiming(0, {
        duration: 180,
        easing: CONTEXT_MENU_EASING,
      });
    }, [highlight]);

    const handlePress = useCallback(() => onTap(action), [onTap, action]);

    const highlightStyle = useAnimatedStyle(() => ({
      opacity: highlight.value,
    }));

    return (
      <Pressable
        unstable_pressDelay={0}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <View style={styles.actionRow}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.actionHighlight,
              highlightStyle,
            ]}
          />
          {action.systemImage !== undefined && (
            <View style={styles.actionIcon}>
              <SfSymbolIcon
                name={action.systemImage}
                color={
                  action.isDestructive
                    ? theme.actionDestructiveIconColor
                    : theme.actionIconColor
                }
              />
            </View>
          )}
          <Text
            style={
              action.isDestructive
                ? styles.actionDestructiveTitle
                : styles.actionTitle
            }
            numberOfLines={1}
            allowFontScaling={false}
          >
            {action.title}
          </Text>
        </View>
      </Pressable>
    );
  },
);

ActionRow.displayName = "ActionRow";

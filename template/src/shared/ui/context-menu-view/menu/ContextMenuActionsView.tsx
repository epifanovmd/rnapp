import React, { FC, Fragment, memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ContextMenuAction } from "../types";
import { CONTEXT_MENU_ACTION_SEPARATOR_HEIGHT } from "../utils";
import { IContextMenuTheme } from "../utils";
import { SfSymbolIcon } from "./SfSymbolIcon";

const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

const ICON_TITLE_GAP = 10;

interface IActionRowProps {
  action: ContextMenuAction;
  theme: IContextMenuTheme;
  onTap: (action: ContextMenuAction) => void;
}

const ActionRow: FC<IActionRowProps> = memo(({ action, theme, onTap }) => {
  const highlight = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    highlight.value = withTiming(1, { duration: 80, easing: EASE_IN_OUT });
  }, [highlight]);

  const handlePressOut = useCallback(() => {
    highlight.value = withTiming(0, { duration: 180, easing: EASE_IN_OUT });
  }, [highlight]);

  const handlePress = useCallback(() => onTap(action), [onTap, action]);

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlight.value,
  }));

  const titleColor = action.isDestructive
    ? theme.actionDestructiveTitleColor
    : theme.actionTitleColor;
  const iconColor = action.isDestructive
    ? theme.actionDestructiveIconColor
    : theme.actionIconColor;

  return (
    <Pressable
      unstable_pressDelay={0}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <View
        style={[
          ss.row,
          {
            height: theme.actionItemHeight,
            paddingHorizontal: theme.actionHorizontalPadding,
          },
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.actionHighlightColor },
            highlightStyle,
          ]}
        />
        {action.systemImage !== undefined && (
          <View style={ss.icon}>
            <SfSymbolIcon name={action.systemImage} color={iconColor} />
          </View>
        )}
        <Text
          style={[
            ss.title,
            { fontSize: theme.actionTitleFontSize, color: titleColor },
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {action.title}
        </Text>
      </View>
    </Pressable>
  );
});

export interface IContextMenuActionsViewProps {
  actions: ContextMenuAction[];
  theme: IContextMenuTheme;
  onActionTap: (action: ContextMenuAction) => void;
}

export const ContextMenuActionsView: FC<IContextMenuActionsViewProps> = memo(
  ({ actions, theme, onActionTap }) => (
    <Animated.View
      style={[
        ss.panel,
        {
          backgroundColor: theme.menuBackground,
          borderRadius: theme.menuCornerRadius,
        },
      ]}
    >
      {actions.map((action, index) => (
        <Fragment key={action.id}>
          <ActionRow action={action} theme={theme} onTap={onActionTap} />
          {index < actions.length - 1 && (
            <View
              style={[
                ss.separator,
                { backgroundColor: theme.menuSeparatorColor },
              ]}
            />
          )}
        </Fragment>
      ))}
    </Animated.View>
  ),
);

const ss = StyleSheet.create({
  panel: {
    flex: 1,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: ICON_TITLE_GAP,
  },
  title: {
    flex: 1,
  },
  separator: {
    height: CONTEXT_MENU_ACTION_SEPARATOR_HEIGHT,
  },
});

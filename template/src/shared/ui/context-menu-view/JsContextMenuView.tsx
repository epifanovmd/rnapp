import React, { FC, memo, useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  GestureDetector,
  useLongPressGesture,
} from "react-native-gesture-handler";
import { HapticFeedbackTypes, trigger } from "react-native-haptic-feedback";

import { resolveContextMenuTheme } from "./config";
import { contextMenuController } from "./context-menu-controller";
import { ContextMenuCloseResult, IContextMenuViewProps } from "./types";

/**
 * JS-реализация контекстного меню.
 *
 * Сам элемент — только View и долгое нажатие: по нему замеряется рамка, и
 * контроллеру уходит запрос на показ. Всё тяжёлое рисует общий оверлей.
 */

const LONG_PRESS_MAX_DISTANCE = 10;
const DEFAULT_MINIMUM_PRESS_DURATION = 0.35;

export const JsContextMenuView: FC<IContextMenuViewProps> = memo(
  ({
    menuId = "",
    emojis = [],
    actions = [],
    theme = "light",
    minimumPressDuration = DEFAULT_MINIMUM_PRESS_DURATION,
    style,
    children,
    onWillShow,
    onEmojiSelect,
    onActionSelect,
    onDismiss,
  }) => {
    const containerRef = useRef<View>(null);

    const [sourceHidden, setSourceHidden] = useState(false);

    const propsRef = useRef({
      menuId,
      emojis,
      actions,
      theme,
      style,
      children,
      onWillShow,
      onEmojiSelect,
      onActionSelect,
      onDismiss,
    });

    propsRef.current = {
      menuId,
      emojis,
      actions,
      theme,
      style,
      children,
      onWillShow,
      onEmojiSelect,
      onActionSelect,
      onDismiss,
    };

    const handleClosed = useCallback((result: ContextMenuCloseResult) => {
      const current = propsRef.current;

      setSourceHidden(false);

      switch (result.type) {
        case "emoji":
          current.onEmojiSelect?.({
            emoji: result.emoji,
            menuId: current.menuId,
          });
          break;
        case "action":
          current.onActionSelect?.({
            actionId: result.actionId,
            menuId: current.menuId,
          });
          break;
        case "dismiss":
          current.onDismiss?.({ menuId: current.menuId });
          break;
      }
    }, []);

    const showMenu = useCallback(() => {
      if (contextMenuController.isPresenting) {
        return;
      }

      const current = propsRef.current;

      if (!current.emojis.length && !current.actions.length) {
        return;
      }

      current.onWillShow?.({ menuId: current.menuId });

      trigger(HapticFeedbackTypes.impactMedium);

      containerRef.current?.measureInWindow((x, y, width, height) => {
        if (!width || !height) {
          return;
        }

        contextMenuController.present({
          session: {
            menuId: current.menuId,
            sourceFrame: { x, y, width, height },
            emojis: [...current.emojis],
            actions: [...current.actions],
          },
          theme: resolveContextMenuTheme(current.theme),
          sourceStyle: current.style,
          content: current.children,
          onShown: () => setSourceHidden(true),
          onClosed: handleClosed,
        });
      });
    }, [handleClosed]);

    const longPressGesture = useLongPressGesture({
      minDuration: minimumPressDuration * 1000,
      maxDistance: LONG_PRESS_MAX_DISTANCE,

      cancelsTouchesInView: false,

      disableReanimated: true,
      onActivate: showMenu,
    });

    return (
      <GestureDetector gesture={longPressGesture}>
        <View
          ref={containerRef}
          collapsable={false}
          style={[style, sourceHidden && ss.hidden]}
        >
          {children}
        </View>
      </GestureDetector>
    );
  },
);

const ss = StyleSheet.create({
  hidden: {
    opacity: 0,
  },
});

JsContextMenuView.displayName = "JsContextMenuView";

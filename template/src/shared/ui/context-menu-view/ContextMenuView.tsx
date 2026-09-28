import React, { FC, memo, useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  GestureDetector,
  useLongPressGesture,
} from "react-native-gesture-handler";
import { HapticFeedbackTypes, trigger } from "react-native-haptic-feedback";

import { contextMenuController } from "./context-menu-controller";
import { ContextMenuHost } from "./menu";
import { ContextMenuCloseResult, IContextMenuViewProps } from "./types";

/**
 * Контекстное меню.
 *
 * Сам элемент — только View и долгое нажатие: по нему замеряется рамка, и
 * контроллеру уходит запрос на показ. Всё тяжёлое рисует общий оверлей.
 */

const LONG_PRESS_MAX_DISTANCE = 10;

/** Долгое нажатие, по которому открывается меню (мс). */
const LONG_PRESS_DURATION_MS = 350;

const ContextMenuViewComponent: FC<IContextMenuViewProps> = memo(
  ({
    emojis = [],
    actions = [],
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
      emojis,
      actions,
      style,
      children,
      onWillShow,
      onEmojiSelect,
      onActionSelect,
      onDismiss,
    });

    propsRef.current = {
      emojis,
      actions,
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
          current.onEmojiSelect?.(result.emoji);
          break;
        case "action":
          current.onActionSelect?.(result.actionId);
          break;
        case "dismiss":
          current.onDismiss?.();
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

      current.onWillShow?.();

      trigger(HapticFeedbackTypes.impactMedium);

      containerRef.current?.measureInWindow((x, y, width, height) => {
        if (!width || !height) {
          return;
        }

        contextMenuController.present({
          session: {
            sourceFrame: { x, y, width, height },
            emojis: [...current.emojis],
            actions: [...current.actions],
          },
          sourceStyle: current.style,
          content: current.children,
          onShown: () => setSourceHidden(true),
          onClosed: handleClosed,
        });
      });
    }, [handleClosed]);

    const longPressGesture = useLongPressGesture({
      minDuration: LONG_PRESS_DURATION_MS,
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

ContextMenuViewComponent.displayName = "ContextMenuView";

/** `ContextMenuView.Host` монтируется один раз в App.tsx: оверлей общий на всё приложение. */
export const ContextMenuView = Object.assign(ContextMenuViewComponent, {
  Host: ContextMenuHost,
});

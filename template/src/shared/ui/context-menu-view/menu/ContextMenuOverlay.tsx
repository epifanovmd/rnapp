import React, {
  FC,
  memo,
  PropsWithChildren,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../lib/theme";
import { contextMenuSkin } from "../config";
import { useContextMenuAnimator } from "../hooks";
import {
  actionsPanelPreferredSize,
  calculateContextMenuLayout,
  emojiPanelPreferredSize,
} from "../layout";
import {
  ContextMenuAction,
  ContextMenuCloseResult,
  IContextMenuRect,
  IContextMenuSession,
} from "../types";
import { ContextMenuActionsView } from "./actions-view";
import { ContextMenuBackdrop } from "./ContextMenuBackdrop";
import { ContextMenuEmojiPanel } from "./emoji-panel";

/**
 * Открытое меню целиком: затемнение, копия
 * исходной вьюхи, панель эмодзи и список действий на прокручиваемом холсте.
 * Существует в единственном экземпляре, монтируется хостом.
 */

export interface IContextMenuOverlayProps {
  session: IContextMenuSession;
  /** Стиль исходного контейнера — для точной копии-«снапшота». */
  sourceStyle?: StyleProp<ViewStyle>;
  /** Модалка показана — пора скрыть оригинал. */
  onShown: () => void;
  /** Close-анимация завершена — оверлей пора демонтировать. */
  onClosed: (result: ContextMenuCloseResult) => void;
}

/** Абсолютное позиционирование по посчитанному прямоугольнику. */
const rectStyle = (rect: IContextMenuRect) =>
  ({
    position: "absolute",
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
  }) as const;

export const ContextMenuOverlay: FC<
  PropsWithChildren<IContextMenuOverlayProps>
> = memo(({ session, sourceStyle, children, onShown, onClosed }) => {
  const screen = useWindowDimensions();
  const safeArea = useSafeAreaInsets();

  const { isDark } = useTheme();
  const { colors, styles } = contextMenuSkin(isDark);

  const layout = useMemo(
    () =>
      calculateContextMenuLayout({
        sourceFrame: session.sourceFrame,
        snapSize: {
          width: session.sourceFrame.width,
          height: session.sourceFrame.height,
        },
        emojiSize: emojiPanelPreferredSize(session.emojis.length),
        actionsSize: actionsPanelPreferredSize(session.actions.length),
        screen: { width: screen.width, height: screen.height },
        safeArea,
      }),
    [session, screen.width, screen.height, safeArea],
  );

  const animator = useContextMenuAnimator(layout, session.sourceFrame);

  // Блокировка повторных нажатий на время анимации закрытия.
  const closingRef = useRef(false);

  const close = useCallback(
    (result: ContextMenuCloseResult) => {
      if (closingRef.current) return;

      closingRef.current = true;
      animator.animateClose(() => onClosed(result));
    },
    [animator, onClosed],
  );

  const handleShow = useCallback(() => {
    onShown();
    animator.animateOpen();
  }, [onShown, animator]);

  const handleBackdropPress = useCallback(
    () => close({ type: "dismiss" }),
    [close],
  );

  const handleEmojiTap = useCallback(
    (emoji: string) => close({ type: "emoji", emoji }),
    [close],
  );

  const handleActionTap = useCallback(
    (action: ContextMenuAction) =>
      close({ type: "action", actionId: action.id }),
    [close],
  );

  const { scrollOffset } = animator;

  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollOffset.value = event.contentOffset.y;
  });

  const canvasStyle = useMemo(
    () => ({
      width: layout.canvasSize.width,
      height: layout.canvasSize.height,
    }),
    [layout.canvasSize.width, layout.canvasSize.height],
  );

  const snapshotContentStyle = useMemo(
    () => [
      sourceStyle,
      ss.snapshotContent,
      { width: layout.snapTarget.width, height: layout.snapTarget.height },
    ],
    [sourceStyle, layout.snapTarget.width, layout.snapTarget.height],
  );

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
      onShow={handleShow}
      onRequestClose={handleBackdropPress}
    >
      <View style={ss.container}>
        <ContextMenuBackdrop
          colors={colors}
          styles={styles}
          animatedStyle={animator.backdropAnimatedStyle}
        />

        <Animated.ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={canvasStyle}
          contentOffset={{ x: 0, y: layout.scrollOffset }}
          scrollEnabled={layout.needsScroll}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleBackdropPress}
          />
          <Animated.View
            style={[
              styles.snapshot,
              rectStyle(layout.snapTarget),
              animator.snapAnimatedStyle,
            ]}
            pointerEvents="box-only"
          >
            <View style={snapshotContentStyle}>{children}</View>
          </Animated.View>

          {layout.hasEmoji && (
            <Animated.View
              style={[
                rectStyle(layout.emojiTarget),
                animator.emojiAnimatedStyle,
              ]}
            >
              <ContextMenuEmojiPanel
                emojis={session.emojis}
                styles={styles}
                onEmojiTap={handleEmojiTap}
              />
            </Animated.View>
          )}

          {layout.hasActions && (
            <Animated.View
              style={[
                rectStyle(layout.actionsTarget),
                animator.actionsAnimatedStyle,
              ]}
            >
              <ContextMenuActionsView
                actions={session.actions}
                colors={colors}
                styles={styles}
                onActionTap={handleActionTap}
              />
            </Animated.View>
          )}
        </Animated.ScrollView>
      </View>
    </Modal>
  );
});

ContextMenuOverlay.displayName = "ContextMenuOverlay";

const ss = StyleSheet.create({
  container: { flex: 1 },
  // Снапшот должен точно совпадать с посчитанным прямоугольником —
  // внешние отступы исходного контейнера обнуляются.
  snapshotContent: {
    overflow: "hidden",
    alignSelf: "stretch",
    margin: 0,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    marginHorizontal: 0,
    marginVertical: 0,
    marginStart: 0,
    marginEnd: 0,
    maxWidth: "100%",
    maxHeight: "100%",
    minWidth: 0,
    minHeight: 0,
  },
});

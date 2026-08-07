import { Portal } from "@gorhom/portal";
import { useMergedCallback } from "@shared/lib/hooks";
import React, { useImperativeHandle, useMemo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { ScrollView } from "../scroll-view";
import { DEFAULT_DURATION } from "./constants";
import { DialogContext, IDialogContext } from "./dialog-context";
import { DialogBackdrop } from "./DialogBackdrop";
import { DialogFooter } from "./DialogFooter";
import { DialogHeader } from "./DialogHeader";
import { DIALOG_HOST_NAME, DialogHost } from "./DialogHost";
import {
  useDialogAnimatedStyles,
  useDialogAnimation,
  useDialogBackButton,
  useDialogGestures,
  useDialogStyles,
  useDialogVisibility,
} from "./hooks";
import { DialogStyles } from "./styles";
import { IDialogProps, IDialogRef, TDialogPlacement } from "./types";

const dialogSlots = {
  header: slot.of(DialogHeader),
  content: slot.of(ScrollView, {
    defaultProps: { bounces: false, flexShrink: 1 },
  }),
  footer: slot.of(DialogFooter),
};

const placementStyles: Record<TDialogPlacement, ViewStyle> = {
  top: DialogStyles.topContainer,
  center: DialogStyles.centerContainer,
  bottom: DialogStyles.bottomContainer,
};

export type Dialog = IDialogRef;

const DialogRoot = ({
  props,
  slots,
  content,
  forwardedRef,
}: CompoundRootProps<IDialogProps, typeof dialogSlots, IDialogRef>) => {
  const {
    isVisible: isVisibleProp,
    onClose,
    onOpened,
    onClosed,
    placement = "center",
    animationType = "slide",
    animationDirection = "down",
    animationDuration: duration = DEFAULT_DURATION,
    width = "85%",
    height = "auto",
    maxWidth = "90%",
    maxHeight = "85%",
    offset = 50,
    enableBackdropClose = true,
    enableSwipeClose = true,
    swipeDirection = animationDirection,
    swipeThreshold = 0.3,
    enableBackButtonClose = true,
    backdropOpacity = 0.6,
    backdropColor = "#000000",
    backdropComponent: BackdropComponent,
    haptic: hapticEnabled = false,
    style,
    ...rest
  } = props;

  const { top, bottom } = useSafeAreaInsets();

  const { isVisible, present, requestClose } = useDialogVisibility(
    isVisibleProp,
    onClose,
  );

  const { mounted, measureCard, ...values } = useDialogAnimation({
    isVisible,
    duration,
    swipeDirection,
    hapticEnabled,
    onOpened,
    onClosed,
  });

  const { backdropProgress, cardAnimatedStyle } = useDialogAnimatedStyles({
    values,
    animationType,
    animationDirection,
    swipeDirection,
  });

  const { tapGesture, panGesture } = useDialogGestures({
    values,
    enableBackdropClose,
    enableSwipeClose,
    swipeDirection,
    swipeThreshold,
    duration,
    requestClose,
  });

  useDialogBackButton(isVisible && enableBackButtonClose, requestClose);

  const { cardStyle: themeCardStyle } = useDialogStyles();

  useImperativeHandle(
    forwardedRef,
    () => ({ present, dismiss: requestClose }),
    [present, requestClose],
  );

  const onCardLayout = useMergedCallback(rest.onLayout, measureCard);

  const containerStyle = useMemo<StyleProp<ViewStyle>>(
    () => [
      placementStyles[placement],
      { paddingTop: top || offset, paddingBottom: bottom || offset },
    ],
    [placement, top, bottom, offset],
  );

  const cardStyle = useMemo<StyleProp<ViewStyle>>(
    () => [
      DialogStyles.card,
      themeCardStyle,
      { width, height, maxWidth, maxHeight },
    ],
    [themeCardStyle, width, height, maxWidth, maxHeight],
  );

  const dialogContext = useMemo<IDialogContext>(
    () => ({ close: requestClose }),
    [requestClose],
  );

  if (!mounted) {
    return null;
  }

  return (
    <Portal hostName={DIALOG_HOST_NAME}>
      <View style={DialogStyles.overlay}>
        <View style={containerStyle}>
          <GestureDetector gesture={tapGesture}>
            {BackdropComponent ? (
              <BackdropComponent
                progress={backdropProgress}
                style={DialogStyles.backdrop}
              />
            ) : (
              <DialogBackdrop
                progress={backdropProgress}
                color={backdropColor}
                opacity={backdropOpacity}
                style={DialogStyles.backdrop}
              />
            )}
          </GestureDetector>

          <GestureDetector gesture={panGesture}>
            <Animated.View
              role={"dialog"}
              accessibilityViewIsModal
              {...rest}
              onLayout={onCardLayout}
              style={[cardStyle, cardAnimatedStyle, style]}
            >
              <DialogContext.Provider value={dialogContext}>
                {slots.header.render()}
                {slots.content.present
                  ? slots.content.render({ defaults: { children: content } })
                  : content}
                {slots.footer.render()}
              </DialogContext.Provider>
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
    </Portal>
  );
};

export const Dialog = Object.assign(
  createCompound<IDialogProps, IDialogRef>()({
    name: "Dialog",
    render: DialogRoot,
    slots: dialogSlots,
  }),
  { Host: DialogHost },
);

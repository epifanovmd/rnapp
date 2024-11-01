import React, { FC, memo, PropsWithChildren, useMemo, useState } from "react";
import {
  Animated,
  ColorValue,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import haptic from "react-native-haptic-feedback";
import Svg, { Path } from "react-native-svg";

import { IMessage } from "./types";

export interface IReplySwipeProps extends ViewProps {
  message: IMessage;
  replyIconColor?: ColorValue;
  onReply?: (message: IMessage) => void;
  renderReplyIcon?: () => React.JSX.Element | null;
}

export const ReplySwipe: FC<PropsWithChildren<IReplySwipeProps>> = memo(
  ({
    message,
    replyIconColor = "#fff",
    onReply,
    renderReplyIcon,
    children,
    ...rest
  }) => {
    const [complete, setComplete] = useState(false);
    const [animation] = useState(new Animated.ValueXY({ x: 0, y: 0 }));

    const { panHandlers } = useMemo(
      () =>
        PanResponder.create({
          onMoveShouldSetPanResponder: (_, gestureState) => {
            return Math.abs(gestureState.dx) > 10;
          },
          onPanResponderMove: (_, gestureState) => {
            if (gestureState.dx < 0 && !complete) {
              if (Math.ceil(gestureState.dx) < -70) {
                setComplete(true);
                haptic.trigger("impactHeavy");
                onReply?.(message);
                Animated.spring(animation, {
                  toValue: { x: 0, y: 0 },
                  useNativeDriver: Platform.OS !== "web",
                }).start();
              } else {
                animation.setValue({
                  x: gestureState.dx / 1.5,
                  y: gestureState.dy,
                });
              }
            }
          },
          onPanResponderRelease: () => {
            setComplete(false);
            Animated.spring(animation, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: Platform.OS !== "web",
            }).start();
          },
        }),
      [animation, complete, message, onReply],
    );

    const style = useMemo<ViewStyle>(
      () => ({
        transform: [
          {
            translateX: animation.getTranslateTransform()[0].translateX,
          },
        ],
      }),
      [animation],
    );

    return (
      <Animated.View {...rest} {...panHandlers} style={[rest.style, style]}>
        {children}
        <View style={s.icon}>
          {renderReplyIcon?.() ?? (
            <Svg
              fill={replyIconColor}
              height={24}
              width={24}
              viewBox="0 0 24 24"
            >
              <Path d="M10,9V5L3,12L10,19V14.9C15,14.9 18.5,16.5 21,20C20,15 17,10 10,9Z" />
            </Svg>
          )}
        </View>
      </Animated.View>
    );
  },
);

const s = StyleSheet.create({
  icon: { position: "absolute", right: -24, top: 0 },
});

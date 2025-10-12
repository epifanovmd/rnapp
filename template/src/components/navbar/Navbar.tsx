import { useTheme } from "@core";
import { createSlot, useSlotProps } from "@force-dev/react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { memo, useCallback, useRef, useState } from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NavbarIcon } from "./NavbarIcon";
import { INavbarSubTitleProps, NavbarSubTitle } from "./NavbarSubTitle";
import { INavbarTitleProps, NavbarTitle } from "./NavbarTitle";

export interface INavbarProps extends ViewProps {
  title?: string;
  safeArea?: boolean;
  transparent?: boolean;
}

const BackButton = createSlot<TouchableOpacityProps>("BackButton");
const Left = createSlot<ViewProps>("Left");
const Content = createSlot<ViewProps>("Content");
const Title = createSlot<INavbarTitleProps>("Title");
const Subtitle = createSlot<INavbarSubTitleProps>("Subtitle");
const Right = createSlot<ViewProps>("Right");

const _Navbar = memo<INavbarProps>(
  ({ title: titleText, style, safeArea, transparent, children, ...rest }) => {
    const { colors } = useTheme();
    const leftRef = useRef<View>(null);
    const rightRef = useRef<View>(null);
    const [width, setWidth] = React.useState<number>();
    const [isCanGoBack, setIsCanGoBack] = useState(false);
    const { top } = useSafeAreaInsets();

    const { $children, left, backButton, content, title, subtitle, right } =
      useSlotProps(Navbar, children);

    const { canGoBack, goBack } = useNavigation();

    useFocusEffect(() => {
      if (backButton && !backButton.onPress) {
        setIsCanGoBack(canGoBack());
      }
    });

    const showBackButton = backButton && (isCanGoBack || !!backButton.onPress);

    const onUpdateWidth = useCallback(() => {
      if (leftRef.current && rightRef.current) {
        leftRef.current.measure((_x, _y, leftWidth) => {
          rightRef.current?.measure((_x1, _y1, rightWidth) => {
            const w = Math.max(leftWidth, rightWidth);

            setWidth(w);
          });
        });
      }
    }, []);

    const handleBackPress = useCallback(
      (e: GestureResponderEvent) => {
        if (backButton?.onPress) {
          backButton.onPress(e);
        } else if (isCanGoBack) {
          goBack();
        }
      },
      [backButton, isCanGoBack, goBack],
    );

    const backgroundColor = transparent ? undefined : colors.background;
    const paddingTop = safeArea ? top : undefined;

    return (
      <View
        style={[SS.container, { backgroundColor, paddingTop }, style]}
        {...rest}
      >
        <View style={[SS.left, { minWidth: width }]}>
          <View ref={leftRef} style={SS.row} onLayout={onUpdateWidth}>
            {showBackButton && (
              <TouchableOpacity onPress={handleBackPress}>
                <NavbarIcon name={"back"} />
              </TouchableOpacity>
            )}
            <View {...left} />
          </View>
        </View>
        <View style={SS.center}>
          <View style={[SS.content]}>
            {$children?.length ? (
              $children
            ) : content ? (
              <View {...content} />
            ) : (
              <>
                {!!(title || titleText) && (
                  <NavbarTitle text={titleText} {...title} />
                )}
                {!!subtitle && <NavbarSubTitle {...subtitle} />}
              </>
            )}
          </View>
        </View>
        <View style={[SS.right, { minWidth: width }]}>
          <View ref={rightRef} style={SS.row} onLayout={onUpdateWidth}>
            <View {...right} />
          </View>
        </View>
      </View>
    );
  },
);

export const Navbar = Object.assign(_Navbar, {
  BackButton,
  Left,
  Content,
  Title,
  Subtitle,
  Right,
});

const SS = StyleSheet.create({
  container: {
    overflow: "hidden",
    padding: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56,
    zIndex: 9999,
  },
  left: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  center: {
    marginLeft: 4,
    marginRight: 4,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    justifyContent: "center",
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 48,
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
  },
  right: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-end",
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
});

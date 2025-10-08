import { useTheme } from "@core";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { memo, useCallback, useRef, useState } from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NavbarIcon } from "./NavbarIcon";
import { NavbarSubTitle } from "./NavbarSubTitle";
import { NavbarTitle } from "./NavbarTitle";

export interface INavbarProps extends ViewProps {
  readonly title?: string;
  readonly subTitle?: string;
  readonly backButton?: boolean;
  readonly onBackPress?: (e: GestureResponderEvent) => void;
  readonly left?: React.ReactNode;
  readonly right?: React.ReactNode;
  readonly safeArea?: boolean;
}

export const Navbar = memo<INavbarProps>(
  ({
    title,
    subTitle,
    style,
    backButton = true,
    onBackPress,
    left,
    right,
    safeArea,
    children,
    ...rest
  }) => {
    const { colors } = useTheme();
    const leftRef = useRef<View>(null);
    const rightRef = useRef<View>(null);
    const [width, setWidth] = React.useState<number>();
    const [isCanGoBack, setIsCanGoBack] = useState(false);

    const { canGoBack, goBack } = useNavigation();

    useFocusEffect(() => {
      if (backButton && !onBackPress) {
        setIsCanGoBack(canGoBack());
      }
    });

    const showBackButton = backButton && (isCanGoBack || !!onBackPress);

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
        if (onBackPress) {
          onBackPress(e);
        } else if (isCanGoBack) {
          goBack();
        }
      },
      [isCanGoBack, goBack, onBackPress],
    );

    return (
      <SafeAreaView
        edges={safeArea ? ["top"] : []}
        style={[{ backgroundColor: colors.background }, style]}
        {...rest}
      >
        <View style={SS.container}>
          <View style={[SS.left, { minWidth: width }]}>
            <View ref={leftRef} style={SS.row} onLayout={onUpdateWidth}>
              {showBackButton && (
                <TouchableOpacity onPress={handleBackPress}>
                  <NavbarIcon name={"back"} />
                </TouchableOpacity>
              )}
              {left}
            </View>
          </View>
          <View style={[SS.center]}>
            {children ?? (
              <View style={[SS.content]}>
                {!!title && <NavbarTitle>{title}</NavbarTitle>}
                {!!subTitle && <NavbarSubTitle>{subTitle}</NavbarSubTitle>}
              </View>
            )}
          </View>
          <View style={[SS.right, { minWidth: width }]}>
            <View ref={rightRef} style={SS.row} onLayout={onUpdateWidth}>
              {right}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  },
);

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

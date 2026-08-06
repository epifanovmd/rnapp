import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTheme } from "@shared/lib/theme";
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

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { NavbarIcon } from "./NavbarIcon";
import { INavbarSubTitleProps, NavbarSubTitle } from "./NavbarSubTitle";
import { INavbarTitleProps, NavbarTitle } from "./NavbarTitle";

export interface INavbarProps extends ViewProps {
  title?: string;
  safeArea?: boolean;
  transparent?: boolean;
}

const navbarSlots = {
  backButton: slot<TouchableOpacityProps>({ component: TouchableOpacity }),
  left: slot<ViewProps>({ component: View }),
  content: slot<ViewProps>({ component: View }),
  title: slot<INavbarTitleProps>({ component: NavbarTitle }),
  subtitle: slot<INavbarSubTitleProps>({ component: NavbarSubTitle }),
  right: slot<ViewProps>({ component: View }),
};

const NavbarRoot = memo(
  ({
    props,
    slots,
    content: restContent,
    contentItems,
  }: CompoundRootProps<INavbarProps, never, typeof navbarSlots>) => {
    const { title: titleText, style, safeArea, transparent, ...rest } = props;
    const { colors } = useTheme();
    const leftRef = useRef<View>(null);
    const rightRef = useRef<View>(null);
    const [width, setWidth] = React.useState<number>();
    const [isCanGoBack, setIsCanGoBack] = useState(false);
    const { top } = useSafeAreaInsets();

    const { left, backButton, content, title, subtitle, right } = slots;

    const { canGoBack, goBack } = useNavigation();

    useFocusEffect(() => {
      if (backButton.present && !backButton.props?.onPress) {
        setIsCanGoBack(canGoBack());
      }
    });

    const showBackButton =
      backButton.present && (isCanGoBack || !!backButton.props?.onPress);

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
        if (backButton.props?.onPress) {
          backButton.props.onPress(e);
        } else if (isCanGoBack) {
          goBack();
        }
      },
      [backButton.props, isCanGoBack, goBack],
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
              <TouchableOpacity {...backButton.props} onPress={handleBackPress}>
                <NavbarIcon name={"back"} />
              </TouchableOpacity>
            )}
            {left.present && <View {...left.props} />}
          </View>
        </View>
        <View style={SS.center}>
          <View style={[SS.content]}>
            {contentItems.length ? (
              restContent
            ) : content.present ? (
              <View {...content.props} />
            ) : (
              <>
                {!!(title.present || titleText) && (
                  <NavbarTitle text={titleText} {...title.props} />
                )}
                {subtitle.present && <NavbarSubTitle {...subtitle.props} />}
              </>
            )}
          </View>
        </View>
        <View style={[SS.right, { minWidth: width }]}>
          <View ref={rightRef} style={SS.row} onLayout={onUpdateWidth}>
            {right.present && <View {...right.props} />}
          </View>
        </View>
      </View>
    );
  },
);

export const Navbar = createCompound<INavbarProps, never>()({
  name: "Navbar",
  render: NavbarRoot,
  slots: navbarSlots,
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

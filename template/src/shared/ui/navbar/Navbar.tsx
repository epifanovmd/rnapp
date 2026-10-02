import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTheme } from "@shared/lib/theme";
import React, { useContext, useState } from "react";
import { StyleSheet, TouchableOpacity, View, ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { BalancedRow } from "../balanced-row";
import {
  BarSurfaceContext,
  bottomRadiusStyle,
  IBarAppearanceProps,
  resolveBarBackground,
} from "./bar-appearance";
import { NavbarIcon } from "./NavbarIcon";
import { NavbarSubTitle } from "./NavbarSubTitle";
import { NavbarTitle } from "./NavbarTitle";

export interface INavbarProps extends ViewProps, IBarAppearanceProps {
  title?: string;
  safeArea?: boolean;
  /** Без фона. Внутри `HiddenBar`/`ImageBar` — по умолчанию (фон у них). */
  transparent?: boolean;
}

const navbarSlots = {
  backButton: slot.of(TouchableOpacity, {
    defaultProps: { children: <NavbarIcon name={"back"} /> },
  }),
  left: slot.of(View),
  content: slot.of(View),
  title: slot.of(NavbarTitle, { always: true }),
  subtitle: slot.of(NavbarSubTitle),
  right: slot.of(View),
  /** Слой поверх строки навбара (ниже safe area): поле поиска и т.п. */
  overlay: slot.of(View),
};

const NavbarRoot = ({
  props,
  slots,
  content: restContent,
  hasContent,
}: CompoundRootProps<INavbarProps, typeof navbarSlots>) => {
  const {
    title: titleText,
    style,
    safeArea,
    transparent: transparentProp,
    background,
    bottomRadius,
    ...rest
  } = props;
  const { colors } = useTheme();
  const onSurface = useContext(BarSurfaceContext);
  const transparent =
    transparentProp ?? (onSurface && background === undefined);
  const [isCanGoBack, setIsCanGoBack] = useState(false);
  const { top } = useSafeAreaInsets();

  const { left, backButton, content, title, subtitle, right, overlay } =
    slots;

  const { canGoBack, goBack } = useNavigation();

  useFocusEffect(() => {
    if (backButton.present && !backButton.props?.onPress) {
      setIsCanGoBack(canGoBack());
    }
  });

  const showBackButton =
    backButton.present && (isCanGoBack || !!backButton.props?.onPress);

  const backgroundColor = transparent
    ? undefined
    : resolveBarBackground(background, colors);
  const paddingTop = safeArea ? top : undefined;
  // Свой onPress потребителя остаётся, goBack дописывается только при его отсутствии.
  const onBackPress =
    isCanGoBack && !backButton.props?.onPress ? goBack : undefined;

  return (
    <BalancedRow
      style={[
        SS.container,
        { backgroundColor, paddingTop },
        bottomRadiusStyle(bottomRadius),
        style,
      ]}
      centerStyle={SS.center}
      leftContent={
        <>
          {showBackButton &&
            backButton.render({ inject: { onPress: onBackPress } })}
          {left.render()}
        </>
      }
      rightContent={right.render()}
      overlay={
        overlay.present
          ? overlay.render({
              defaults: { pointerEvents: "box-none" },
              inject: {
                style: [SS.overlay, { top: paddingTop ?? 0 }],
              },
            })
          : undefined
      }
      {...rest}
    >
      {hasContent ? (
        restContent
      ) : content.present ? (
        content.render()
      ) : (
        <>
          {!!(title.present || titleText) &&
            title.render({ defaults: { text: titleText } })}
          {subtitle.render()}
        </>
      )}
    </BalancedRow>
  );
};

export const Navbar = createCompound<INavbarProps>()({
  name: "Navbar",
  render: NavbarRoot,
  slots: navbarSlots,
});

const SS = StyleSheet.create({
  container: {
    overflow: "hidden",
    padding: 4,
    minHeight: 56,
    zIndex: 9999,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  center: {
    marginLeft: 4,
    marginRight: 4,
    alignSelf: "center",
    minHeight: 48,
  },
});

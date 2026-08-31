import { IUserStore } from "@entities/user";
import { useBiometric } from "@features/biometric";
import { SignOutButton } from "@features/sign-out";
import { useInterpolatedValue } from "@shared/lib/animation";
import { useRoute } from "@shared/lib/navigation";
import { ScrollProvider, useScrollTelemetry } from "@shared/lib/scroll";
import { useTheme } from "@shared/lib/theme";
import {
  Col,
  Container,
  Content,
  Navbar,
  Row,
  Switch,
  SwitchTheme,
  Text,
} from "@shared/ui";
import { useTabBarHeight, useTabBarScrollSync } from "@widgets/app-shell";
import { User } from "lucide-react-native";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useState } from "react";
import { LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedCol = Animated.createAnimatedComponent(Col);

const height = 250;

export const Settings: FC = observer(() => {
  const { user } = IUserStore.useInstance();
  const tabBarHeight = useTabBarHeight();
  const telemetry = useScrollTelemetry();

  useTabBarScrollSync(telemetry);
  const [navbarLayoutHeight, setNavbarLayoutHeight] = useState(0);
  const onLayoutNavBar = useCallback((event: LayoutChangeEvent) => {
    setNavbarLayoutHeight(event.nativeEvent.layout.height);
  }, []);
  const { support, registration, available, onRemoveBiometric } =
    useBiometric();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const navbarHeight = navbarLayoutHeight + insets.top;

  const headerHeight = useInterpolatedValue(
    telemetry.offsetY,
    [0, height - navbarHeight],
    [height, navbarHeight],
  );
  const avatarSize = useInterpolatedValue(
    telemetry.offsetY,
    [0, height - navbarHeight],
    [100, 0],
  );
  const avatarOpacity = useInterpolatedValue(
    telemetry.offsetY,
    [0, height / 3, height],
    [1, 0, 0],
  );

  const animatedStyles = useAnimatedStyle(() => ({
    height: headerHeight.value,
  }));

  const animatedAvatarStyles = useAnimatedStyle(() => ({
    height: avatarSize.value,
    width: avatarSize.value,
    opacity: avatarOpacity.value,
  }));

  return (
    <ScrollProvider telemetry={telemetry}>
      <Container>
        <Content>
          <AnimatedCol
            style={animatedStyles}
            zIndex={9999}
            absolute
            left={0}
            right={0}
            centerContent={true}
            pt={insets.top}
            bottomRadius={24}
            bg={"surface"}
            pointerEvents={"none"}
          >
            <Col alignItems={"center"}>
              <AnimatedCol
                style={animatedAvatarStyles}
                circle={80}
                overflow={"hidden"}
                centerContent={true}
                bg={"onSurface"}
              >
                <User color={colors.textPrimary} />
              </AnimatedCol>

              <Navbar
                title={user?.email ?? undefined}
                transparent={true}
                onLayout={onLayoutNavBar}
              />
            </Col>
          </AnimatedCol>

          <Animated.ScrollView
            onScroll={telemetry.scrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: tabBarHeight },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Col bg={"surface"} radius={16}>
              <Row
                alignItems={"center"}
                justifyContent={"space-between"}
                pa={16}
              >
                <Text textStyle={"Title_S1"}>{"Тема"}</Text>
                <SwitchTheme />
              </Row>

              <Row
                alignItems={"center"}
                justifyContent={"space-between"}
                pa={16}
              >
                <Text textStyle={"Title_S1"}>{"Подключить Face ID"}</Text>
                {support && (
                  <Switch
                    isActive={available}
                    onChange={active =>
                      active ? registration() : onRemoveBiometric()
                    }
                  />
                )}
              </Row>
            </Col>

            <Col bg={"surface"} radius={16}>
              <Row centerContent={true} pa={16}>
                <SignOutButton />
              </Row>
            </Col>
          </Animated.ScrollView>
        </Content>
      </Container>
    </ScrollProvider>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingTop: 266,
    gap: 16,
  },
});

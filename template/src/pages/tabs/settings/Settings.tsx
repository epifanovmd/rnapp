import { IAuthStore } from "@entities/auth";
import { IUserStore } from "@entities/user";
import { useBiometric } from "@features/biometric";
import { useRoute } from "@shared/lib/navigation";
import { useScrollTelemetry } from "@shared/lib/scroll";
import { useTheme } from "@shared/lib/theme";
import { useTransition } from "@shared/lib/transition";
import {
  Button,
  Col,
  Container,
  Content,
  Navbar,
  Row,
  Switch,
  SwitchTheme,
  Text,
} from "@shared/ui";
import { User } from "lucide-react-native";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedCol = Animated.createAnimatedComponent(Col);

const height = 250;

export const Settings: FC = observer(() => {
  const { name } = useRoute();
  const { signOut } = IAuthStore.useInstance();
  const { user } = IUserStore.useInstance();
  const { tabBar } = useTransition();
  const telemetry = useScrollTelemetry();
  const [navbarLayoutHeight, setNavbarLayoutHeight] = useState(0);
  const onLayoutNavBar = useCallback((event: LayoutChangeEvent) => {
    setNavbarLayoutHeight(event.nativeEvent.layout.height);
  }, []);
  const { support, registration, available, onRemoveBiometric } =
    useBiometric();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const navbarHeight = navbarLayoutHeight + insets.top;

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: interpolate(
        telemetry.offsetY.value,
        [0, height - navbarHeight],
        [height, navbarHeight],
        Extrapolation.CLAMP,
      ),
    };
  });

  const animatedAvatarStyles = useAnimatedStyle(() => {
    const size = interpolate(
      telemetry.offsetY.value,
      [0, height - navbarHeight],
      [100, 0],
      Extrapolation.CLAMP,
    );

    return {
      height: size,
      width: size,
      opacity: interpolate(
        telemetry.offsetY.value,
        [0, height / 3, height],
        [1, 0, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
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
          contentContainerStyle={{
            paddingTop: 250 + 16,
            paddingBottom: tabBar.height,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Col bg={"surface"} radius={16}>
            <Row alignItems={"center"} justifyContent={"space-between"} pa={16}>
              <Text textStyle={"Title_S1"}>{"Тема"}</Text>
              <SwitchTheme />
            </Row>

            <Row alignItems={"center"} justifyContent={"space-between"} pa={16}>
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
              <Button color={"danger"} appearance={"ghost"} onPress={signOut}>
                {"Выйти"}
              </Button>
            </Row>
          </Col>
        </Animated.ScrollView>
      </Content>
    </Container>
  );
});

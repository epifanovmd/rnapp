import { useBiometric } from "@common";
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
} from "@components";
import {
  AppScreenProps,
  TransitionProvider,
  useTheme,
  useTransitionContext,
} from "@core";
import { useSessionDataStore, useUserDataStore } from "@store";
import { User } from "lucide-react-native";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedCol = Animated.createAnimatedComponent(Col);

const height = 250;

export const Settings: FC<AppScreenProps> = observer(({ route: { name } }) => {
  const { user } = useUserDataStore();
  const context = useTransitionContext();
  const { clear } = useSessionDataStore();
  const { support, registration, available, onRemoveBiometric } =
    useBiometric();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const navbarHeight = context.navbarHeight + insets.top;

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: interpolate(
        context.transitionY.value,
        [0, height - navbarHeight],
        [height, navbarHeight],
        Extrapolation.CLAMP,
      ),
    };
  });

  const animatedAvatarStyles = useAnimatedStyle(() => {
    const size = interpolate(
      context.transitionY.value,
      [0, height - navbarHeight],
      [100, 0],
      Extrapolation.CLAMP,
    );

    return {
      height: size,
      width: size,
      opacity: interpolate(
        context.transitionY.value,
        [0, height / 3, height],
        [1, 0, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <TransitionProvider context={context}>
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
                title={user?.email}
                transparent={true}
                onLayout={context.onLayoutNavBar}
              />
            </Col>
          </AnimatedCol>

          <Animated.ScrollView
            onScroll={context.onScroll}
            contentContainerStyle={{
              paddingTop: 250 + 16,
              paddingBottom: context.tabBarHeight,
              gap: 16,
            }}
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
                    onChange={active => {
                      active ? registration() : onRemoveBiometric();
                    }}
                  />
                )}
              </Row>
            </Col>

            <Col bg={"surface"} radius={16}>
              <Row centerContent={true} pa={16}>
                <Button color={"red500"} type={"text"} onPress={clear}>
                  {"Выйти"}
                </Button>
              </Row>
            </Col>
          </Animated.ScrollView>
        </Content>
      </Container>
    </TransitionProvider>
  );
});

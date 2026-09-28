import { IUserStore } from "@entities/user";
import { useBiometric } from "@features/biometric";
import { SignOutButton } from "@features/sign-out";
import { useInterpolatedValue } from "@shared/lib/animation";
import { useLayout } from "@shared/lib/hooks";
import { useNavigation } from "@shared/lib/navigation";
import { ScrollProvider, useScrollTelemetry } from "@shared/lib/scroll";
import { useTheme } from "@shared/lib/theme";
import {
  Avatar,
  Col,
  Container,
  Content,
  Icon,
  Navbar,
  Row,
  Switch,
  SwitchTheme,
  Text,
  Touchable,
} from "@shared/ui";
import { useTabBarHeight } from "@widgets/app-shell";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedCol = Animated.createAnimatedComponent(Col);

const height = 250;

type TAccountRoute = "Profile" | "Security" | "Audit" | "Files" | "Jobs";

const ACCOUNT_LINKS: { route: TAccountRoute; title: string }[] = [
  { route: "Profile", title: "Профиль" },
  { route: "Security", title: "Безопасность" },
  { route: "Audit", title: "Журнал действий" },
  { route: "Files", title: "Мои файлы" },
  { route: "Jobs", title: "Фоновые задачи" },
];

export const Settings: FC = observer(() => {
  const { model } = IUserStore.useInstance();
  const navigation = useNavigation();
  const tabBarHeight = useTabBarHeight();
  const telemetry = useScrollTelemetry();

  const { height: navbarLayoutHeight, onLayout: onLayoutNavBar } = useLayout();
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
                <Avatar
                  size={80}
                  url={model?.avatarUrl}
                  name={model?.displayName}
                />
              </AnimatedCol>

              <Navbar
                title={model?.displayName}
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
              {ACCOUNT_LINKS.map(({ route, title }) => (
                <Touchable
                  key={route}
                  row={true}
                  alignItems={"center"}
                  justifyContent={"space-between"}
                  pa={16}
                  onPress={() => navigation.navigate(route)}
                >
                  <Text textStyle={"Title_S1"}>{title}</Text>
                  <Icon name={"chevronRight"} color={colors.textSecondary} />
                </Touchable>
              ))}
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

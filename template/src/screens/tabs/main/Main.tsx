import {
  Col,
  Container,
  Content,
  HiddenBar,
  Navbar,
  RefreshingContainer,
  SwitchTheme,
  Text,
} from "@components";
import {
  AppScreenProps,
  TransitionProvider,
  useTransitionContext,
} from "@core";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { View } from "react-native";

export const Main: FC<AppScreenProps> = observer(({ route: { name } }) => {
  const context = useTransitionContext();

  // const styles = useAnimatedStyle(() => {
  //   return {
  //     height: interpolate(
  //       context.transitionY.value,
  //       [0, 205, 300],
  //       [300, 95, 95],
  //     ),
  //     opacity: interpolate(
  //       context.transitionY.value,
  //       [0, 200, 250, 300],
  //       [1, 1, 0.4, 0.4],
  //     ),
  //   };
  // });

  console.log("navbarHeight", context.navbarHeight);

  return (
    <TransitionProvider context={context}>
      <Container edges={[]}>
        <HiddenBar safeArea>
          <Navbar
            title={name}
            right={
              <View style={{ margin: 12 }}>
                <SwitchTheme marginLeft={"auto"} />
              </View>
            }
          />
        </HiddenBar>
        {/* <Animated.Image*/}
        {/*  style={[*/}
        {/*    styles,*/}
        {/*    {*/}
        {/*      backgroundColor: "#00000030",*/}
        {/*      position: "absolute",*/}
        {/*      left: 0,*/}
        {/*      right: 0,*/}
        {/*      top: 0,*/}
        {/*      bottom: 0,*/}
        {/*    },*/}
        {/*  ]}*/}
        {/*  source={{ uri: "https://picsum.photos/275/300" }}*/}
        {/* />*/}
        <Content>
          <RefreshingContainer.ScrollView
            onScroll={context.onScroll}
            style={{ paddingTop: context.navbarHeight }}
            showsVerticalScrollIndicator={false}
          >
            {new Array(50).fill(0).map((_, i) => (
              <Col height={60} key={i}>
                <Text>{`Item ${i + 1}`}</Text>
              </Col>
            ))}
          </RefreshingContainer.ScrollView>
        </Content>
      </Container>
    </TransitionProvider>
  );
});

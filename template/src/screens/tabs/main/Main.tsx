import {
  Col,
  Content,
  HiddenBar,
  Navbar,
  RefreshingContainer,
  SwitchTheme,
  Tabs,
  Text,
} from "@components";
import { ImageBar } from "@components/navbar/ImageBar";
import {
  AppScreenProps,
  TransitionProvider,
  useTransitionContext,
} from "@core";
import { observer } from "mobx-react-lite";
import React, { FC, useState } from "react";
import { View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

export const Main: FC<AppScreenProps> = observer(({ route: { name } }) => {
  const context = useTransitionContext();

  const [refreshing, setRefreshing] = useState(false);

  return (
    <TransitionProvider context={context}>
      <ImageBar safeArea uri={"https://picsum.photos/275/300"}>
        <Navbar transparent title={name}>
          <Navbar.Title color={"white"} />
          <Navbar.Right>
            <View style={{ margin: 12 }}>
              <SwitchTheme marginLeft={"auto"} />
            </View>
          </Navbar.Right>
        </Navbar>
      </ImageBar>

      <Content>
        <RefreshingContainer.ScrollView
          refreshing={refreshing}
          refreshingOffset={context.navbarHeight}
          onScroll={context.onScroll}
          contentContainerStyle={{
            paddingTop: 250 - context.navbarHeight + 16,
          }}
          showsVerticalScrollIndicator={false}
          onRefresh={() => {
            setRefreshing(true);

            setTimeout(() => {
              setRefreshing(false);
            }, 1000);
          }}
        >
          {new Array(50).fill(0).map((_, i) => (
            <Col height={60} key={i}>
              <Text>{`Item ${i + 1}`}</Text>
            </Col>
          ))}
        </RefreshingContainer.ScrollView>
      </Content>
    </TransitionProvider>
  );
});

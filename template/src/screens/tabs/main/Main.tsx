import {
  Col,
  Content,
  Navbar,
  RefreshingContainer,
  SwitchTheme,
  Text,
} from "@components";
import { ImageBar } from "@components/navbar/ImageBar";
import {
  AppScreenProps,
  TransitionProvider,
  useTheme,
  useTransition,
} from "@core";
import { observer } from "mobx-react-lite";
import React, { FC, useState } from "react";
import { View } from "react-native";

export const Main: FC<AppScreenProps> = observer(({ route: { name } }) => {
  const context = useTransition();
  const { colors } = useTheme();

  const [refreshing, setRefreshing] = useState(false);

  return (
    <TransitionProvider context={context}>
      <ImageBar height={300} safeArea uri={"https://picsum.photos/275/300"}>
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
        <RefreshingContainer.FlatList
          data={new Array(50).fill(0)}
          refreshing={refreshing}
          refreshingOffset={context.navbarHeight}
          onScroll={context.onScroll}
          contentContainerStyle={{
            paddingTop: 316,
            paddingBottom: context.tabBarHeight,
          }}
          showsVerticalScrollIndicator={false}
          onRefresh={() => {
            setRefreshing(true);

            setTimeout(() => {
              setRefreshing(false);
            }, 1000);
          }}
          ItemSeparatorComponent={() => <Col height={8} />}
          renderItem={({ index }) => (
            <Col
              bg={colors.surface}
              radius={16}
              pa={8}
              height={120}
              key={index}
            >
              <Text textStyle={"Title_L"}>{`Карточка ${index + 1}`}</Text>
              <Text textStyle={"Body_M1"} color={"secondary"}>
                {"Текст"}
              </Text>
              <Text textStyle={"Body_M1"} color={"secondary"}>
                {"Текст"}
              </Text>
            </Col>
          )}
        />
      </Content>
    </TransitionProvider>
  );
});

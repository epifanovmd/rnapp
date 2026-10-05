import { ScrollProvider, useScrollTelemetry } from "@shared/lib/scroll";
import {
  Col,
  ImageBar,
  ListItem,
  Navbar,
  useNavbarScrollSync,
} from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NAVBAR_DEMO_ROWS } from "./navbar-demo-data";

const IMAGE_HEIGHT = 300;

/** Список под ImageBar: отступ под картинку — первым элементом скролла. */

export const NavbarImageContent: FC = () => {
  const { bottom } = useSafeAreaInsets();
  const telemetry = useScrollTelemetry();

  useNavbarScrollSync(telemetry);

  return (
    <ScrollProvider telemetry={telemetry}>
      <Col flex={1} bg={"background"}>
        <ImageBar
          height={IMAGE_HEIGHT}
          safeArea
          uri={"https://picsum.photos/600/600"}
        >
          <Navbar transparent title={"Image bar"}>
            <Navbar.BackButton />
            <Navbar.Title color={"white"} />
          </Navbar>
        </ImageBar>

        <Animated.ScrollView
          onScroll={telemetry.scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottom + 16 },
          ]}
        >
          <Col height={IMAGE_HEIGHT + 16} />
          {NAVBAR_DEMO_ROWS.map(row => (
            <ListItem
              key={row}
              title={`Строка ${row}`}
              subtitle={"Картинка схлопывается в навбар"}
            />
          ))}
        </Animated.ScrollView>
      </Col>
    </ScrollProvider>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
});

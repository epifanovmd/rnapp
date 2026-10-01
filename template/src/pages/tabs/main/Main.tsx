import {
  AnchorList,
  IAnchorListRenderItemProps,
} from "@epifanovmd/anchor-list";
import { useRoute } from "@shared/lib/navigation";
import { useAnchorListPullToRefresh } from "@shared/lib/pull-to-refresh";
import { ScrollProvider, useScrollTelemetry } from "@shared/lib/scroll";
import { useTheme } from "@shared/lib/theme";
import {
  Col,
  Content,
  ImageBar,
  Navbar,
  RefreshIndicator,
  Text,
  Touchable,
  useNavbarHeight,
  useNavbarScrollSync,
} from "@shared/ui";
import { useTabBarHeight, useTabBarScrollSync } from "@widgets/app-shell";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback } from "react";
import { StyleSheet } from "react-native";

const CARDS = Array.from({ length: 50 }, (_, index) => index);
const CARD_HEIGHT = 120;
const CARD_GAP = 8;
/** Отступ под ImageBar: шапкой, а не paddingTop — его AnchorList не учитывает. */
const LIST_HEADER = <Col height={316} />;

const keyExtractor = (item: number) => String(item);

export const Main: FC = observer(() => {
  const { name } = useRoute();
  const navbarHeight = useNavbarHeight();
  const tabBarHeight = useTabBarHeight();
  const { colors } = useTheme();

  const telemetry = useScrollTelemetry();

  useNavbarScrollSync(telemetry);
  useTabBarScrollSync(telemetry);

  const onRefresh = useCallback(
    () => new Promise(resolve => setTimeout(resolve, 1500)),
    [],
  );

  const ptr = useAnchorListPullToRefresh({ onRefresh, telemetry });

  const renderItem = useCallback(
    ({ index }: IAnchorListRenderItemProps<number>) => (
      <Touchable bg={colors.onSurface} radius={16} pa={8} height={CARD_HEIGHT}>
        <Text textStyle={"Title_L"}>{`Карточка ${index + 1}`}</Text>
        <Text textStyle={"Body_M1"} color={"textSecondary"}>
          {"Текст"}
        </Text>
        <Text textStyle={"Body_M1"} color={"textSecondary"}>
          {"Текст"}
        </Text>
      </Touchable>
    ),
    [colors.onSurface],
  );

  return (
    <ScrollProvider telemetry={telemetry}>
      <Col flex={1}>
        <ImageBar height={300} safeArea uri={"https://picsum.photos/275/300"}>
          <Navbar transparent title={name}>
            <Navbar.Title color={"white"} />
          </Navbar>
        </ImageBar>

        <Content>
          <RefreshIndicator controller={ptr} topOffset={navbarHeight} />

          <AnchorList
            {...ptr.listProps}
            showsScrollIndicator={false}
            style={styles.list}
            data={CARDS}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            estimatedItemSize={CARD_HEIGHT}
            gap={CARD_GAP}
            ListHeaderComponent={LIST_HEADER}
            contentContainerStyle={{ paddingBottom: tabBarHeight }}
          />
        </Content>
      </Col>
    </ScrollProvider>
  );
});

const styles = StyleSheet.create({ list: { flex: 1 } });

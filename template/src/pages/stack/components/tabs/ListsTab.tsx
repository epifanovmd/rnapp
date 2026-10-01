import {
  AnchorList,
  IAnchorListRenderItemProps,
} from "@epifanovmd/anchor-list";
import { useAnchorListPullToRefresh } from "@shared/lib/pull-to-refresh";
import { useFocusedScroll } from "@shared/lib/scroll";
import {
  Col,
  ListItem,
  RefreshIndicator,
  Text,
  useNavbarHeight,
} from "@shared/ui";
import React, { FC, memo, useCallback, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface IDemoRow {
  id: string;
  title: string;
}

const ROW_HEIGHT = 56;

const createRows = (generation: number): IDemoRow[] =>
  Array.from({ length: 50 }, (_, index) => ({
    id: `${generation}-${index}`,
    title: `Элемент ${index + 1} · обновление ${generation}`,
  }));

const keyExtractor = (row: IDemoRow) => row.id;

const renderItem = ({ item }: IAnchorListRenderItemProps<IDemoRow>) => (
  <ListItem title={item.title} />
);

/** Демо AnchorList с pull-to-refresh внутри top-tab навигатора. */
export const ListsTab: FC = memo(() => {
  const { bottom } = useSafeAreaInsets();
  const navbarHeight = useNavbarHeight();
  const telemetry = useFocusedScroll();
  const [generation, setGeneration] = useState(0);
  const rows = useMemo(() => createRows(generation), [generation]);

  const onRefresh = useCallback(
    () =>
      new Promise<void>(resolve =>
        setTimeout(() => {
          setGeneration(current => current + 1);
          resolve();
        }, 1200),
      ),
    [],
  );

  const ptr = useAnchorListPullToRefresh({ onRefresh, telemetry });

  return (
    <Col flex={1}>
      <RefreshIndicator controller={ptr} topOffset={navbarHeight} />

      <AnchorList
        {...ptr.listProps}
        style={styles.list}
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        estimatedItemSize={ROW_HEIGHT}
        contentContainerStyle={{ paddingBottom: bottom + 16 }}
        ListHeaderComponent={
          <Text
            textStyle={"Body_M1"}
            color={"textSecondary"}
            ph={16}
            pt={navbarHeight + 8}
            pb={8}
          >
            {"AnchorList · 50 элементов · потяните вниз для обновления"}
          </Text>
        }
      />
    </Col>
  );
});

const styles = StyleSheet.create({ list: { flex: 1 } });

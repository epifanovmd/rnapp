import { useScrollTelemetry } from "@shared/lib/scroll";
import {
  filterByQuery,
  pushSearchHistory,
  useSearch,
  useSearchBarSync,
} from "@shared/lib/search";
import {
  Col,
  Container,
  EmptyState,
  HiddenBar,
  IconButton,
  Navbar,
  NavbarInset,
  SearchBar,
  SearchOverlay,
  SearchShiftSpacer,
  SearchShiftView,
  useNavbar,
  useNavbarScrollSync,
  useNavbarVisibleHeight,
} from "@shared/ui";
import React, { FC, useCallback, useMemo, useState } from "react";
import { ListRenderItem, StyleSheet } from "react-native";
import Animated, { useDerivedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ISearchDemoContact,
  SEARCH_DEMO_CONTACTS,
} from "./search-demo-data";
import {
  DEFAULT_HIDDEN_BAR_OPTIONS,
  isOverlayVisible,
} from "./search-demo-options";
import { SearchDemoPanel } from "./SearchDemoPanel";
import { SearchDemoRow } from "./SearchDemoRow";
import { SearchHiddenBarSettings } from "./SearchHiddenBarSettings";

const HISTORY_LIMIT = 6;

const contactFields = (contact: ISearchDemoContact) => [
  contact.name,
  contact.role,
  contact.city,
];

const keyExtractor = (item: ISearchDemoContact) => item.id;

/**
 * Поиск под скрываемой шапкой: строка поиска закреплена, шапка уходит при
 * скролле. Поведение настраивается: оверлей (никогда / весь поиск / только
 * без запроса), прятать ли шапку при открытии, какой её вернуть, «Отмена».
 * Без оверлея или с запросом — список фильтруется на месте. «+» справа от
 * поля — аксессуар, в поиске на его место встаёт «Отмена».
 */
export const SearchHiddenBarContent: FC = () => {
  const { top, bottom } = useSafeAreaInsets();
  const navbar = useNavbar();
  const telemetry = useScrollTelemetry();
  const [options, setOptions] = useState(DEFAULT_HIDDEN_BAR_OPTIONS);
  const [history, setHistory] = useState<string[]>(["Москва", "Анна"]);
  const search = useSearch();

  useNavbarScrollSync(telemetry, { paused: search.activeValue });

  const sync = useSearchBarSync(search, navbar, {
    hideBar: options.hideBar,
    restore: options.restore,
  });

  // Оверлей — под видимой частью шапки (она в безопасной зоне).
  const visibleHeight = useNavbarVisibleHeight();
  const overlayTop = useDerivedValue(
    () => top + visibleHeight.value,
    [top, visibleHeight],
  );

  const overlayVisible = isOverlayVisible(
    options.overlay,
    search.active,
    search.query,
  );
  // Результаты показывает оверлей — список под ним не фильтруется.
  const listQuery = options.overlay === "active" ? "" : search.debouncedQuery;

  const results = useMemo(
    () => filterByQuery(SEARCH_DEMO_CONTACTS, listQuery, contactFields),
    [listQuery],
  );

  const remember = useCallback((query: string) => {
    setHistory(current => pushSearchHistory(current, query, HISTORY_LIMIT));
  }, []);

  const pick = useCallback(
    (contact: ISearchDemoContact) => remember(search.query || contact.name),
    [remember, search.query],
  );

  // Стабильный между нажатиями клавиш: строки перерисовываются по
  // отложенному запросу, а не на каждый символ.
  const renderItem = useCallback<ListRenderItem<ISearchDemoContact>>(
    ({ item }) => <SearchDemoRow contact={item} query={listQuery} />,
    [listQuery],
  );

  const header = useMemo(
    () => (
      <Col>
        <NavbarInset />
        <SearchHiddenBarSettings options={options} onChange={setOptions} />
      </Col>
    ),
    [options],
  );

  return (
    <Container edges={[]}>
      <HiddenBar safeArea>
        <Navbar title={"Контакты"}>
          <Navbar.BackButton />
        </Navbar>
        <HiddenBar.StickyContent style={styles.sticky}>
          <SearchBar
            search={search}
            placeholder={"Имя, должность или город"}
            cancel={options.cancel}
            onSubmit={remember}
          >
            <SearchBar.Accessory>
              <IconButton
                name={"plus"}
                color={"primary"}
                accessibilityLabel={"Новый контакт"}
              />
            </SearchBar.Accessory>
          </SearchBar>
        </HiddenBar.StickyContent>
      </HiddenBar>

      <SearchShiftView sync={sync}>
        <Animated.FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onScroll={telemetry.scrollHandler}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps={"handled"}
          keyboardDismissMode={"on-drag"}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottom + 16 },
          ]}
          ListHeaderComponent={header}
          ListFooterComponent={<SearchShiftSpacer sync={sync} />}
          ListEmptyComponent={
            <EmptyState
              icon={"search"}
              title={"Ничего не найдено"}
              description={`По запросу «${listQuery}» нет контактов`}
              mt={48}
            />
          }
        />
      </SearchShiftView>

      <SearchOverlay visible={overlayVisible} top={overlayTop}>
        <SearchDemoPanel
          search={search}
          history={history}
          onClearHistory={() => setHistory([])}
          onPick={pick}
        />
      </SearchOverlay>
    </Container>
  );
};

const styles = StyleSheet.create({
  sticky: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  list: {
    paddingHorizontal: 16,
  },
});

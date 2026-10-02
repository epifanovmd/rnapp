import { pushSearchHistory, useSearch } from "@shared/lib/search";
import {
  Container,
  Navbar,
  NavbarSearchButton,
  NavbarSearchField,
  SearchOverlay,
} from "@shared/ui";
import React, { FC, useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import {
  ISearchDemoContact,
  SEARCH_DEMO_CONTACTS,
} from "./search-demo-data";
import { SearchDemoPanel } from "./SearchDemoPanel";
import { SearchDemoRow } from "./SearchDemoRow";

const HISTORY_LIMIT = 6;

/**
 * Демо поиска: кнопка в навбаре раскрывает поле на всю ширину, экран
 * переключается в режим поиска (недавние, подсказки, результаты с
 * подсветкой); «Отмена» или «назад» возвращают список.
 */
export const SearchDemo: FC = () => {
  const search = useSearch();
  const [history, setHistory] = useState<string[]>(["Москва", "Анна"]);

  const remember = useCallback((query: string) => {
    setHistory(current => pushSearchHistory(current, query, HISTORY_LIMIT));
  }, []);

  const pick = useCallback(
    (contact: ISearchDemoContact) => remember(search.query || contact.name),
    [remember, search.query],
  );

  return (
    <Container edges={["top"]}>
      <Navbar title={"Контакты"}>
        <Navbar.BackButton />
        <Navbar.Right>
          <NavbarSearchButton search={search} />
        </Navbar.Right>
        <Navbar.Overlay>
          <NavbarSearchField
            search={search}
            placeholder={"Имя, должность или город"}
            onSubmit={remember}
          />
        </Navbar.Overlay>
      </Navbar>

      <View style={styles.fill}>
        <FlatList
          data={SEARCH_DEMO_CONTACTS}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <SearchDemoRow contact={item} query={""} />}
        />
        <SearchOverlay visible={search.active}>
          <SearchDemoPanel
            search={search}
            history={history}
            onClearHistory={() => setHistory([])}
            onPick={pick}
          />
        </SearchOverlay>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});

import { filterByQuery, ISearchController } from "@shared/lib/search";
import {
  Chip,
  Col,
  EmptyState,
  Icon,
  ListItem,
  Row,
  Text,
  Touchable,
} from "@shared/ui";
import React, { FC, useMemo } from "react";
import { FlatList, StyleSheet } from "react-native";

import {
  ISearchDemoContact,
  SEARCH_DEMO_CONTACTS,
  SEARCH_DEMO_SUGGESTIONS,
} from "./search-demo-data";
import { SearchDemoRow } from "./SearchDemoRow";

interface ISearchDemoPanelProps {
  search: ISearchController;
  history: string[];
  onClearHistory: () => void;
  onPick: (contact: ISearchDemoContact) => void;
}

const contactFields = (contact: ISearchDemoContact) => [
  contact.name,
  contact.role,
  contact.city,
];

/**
 * Режим поиска: без запроса — недавние запросы и подсказки, с запросом —
 * результаты с подсветкой, без совпадений — пустое состояние.
 */
export const SearchDemoPanel: FC<ISearchDemoPanelProps> = ({
  search,
  history,
  onClearHistory,
  onPick,
}) => {
  const query = search.debouncedQuery;
  const results = useMemo(
    () => filterByQuery(SEARCH_DEMO_CONTACTS, query, contactFields),
    [query],
  );

  if (!search.query) {
    return (
      <Col pa={16} gap={20}>
        {history.length > 0 && (
          <Col gap={4}>
            <Row alignItems={"center"} justifyContent={"space-between"}>
              <Text textStyle={"Title_S1"}>{"Недавние"}</Text>
              <Touchable onPress={onClearHistory} hitSlop={8}>
                <Text textStyle={"Body_S2"} color={"primary"}>
                  {"Очистить"}
                </Text>
              </Touchable>
            </Row>
            {history.map(item => (
              <ListItem
                key={item}
                leading={<Icon name={"clock"} size={18} />}
                title={item}
                pv={8}
                onPress={() => search.setQuery(item)}
              />
            ))}
          </Col>
        )}
        <Col gap={10}>
          <Text textStyle={"Title_S1"}>{"Попробуйте"}</Text>
          <Row gap={8} wrap={"wrap"}>
            {SEARCH_DEMO_SUGGESTIONS.map(item => (
              <Chip
                key={item}
                text={item}
                onPress={() => search.setQuery(item)}
              />
            ))}
          </Row>
        </Col>
      </Col>
    );
  }

  if (query && results.length === 0) {
    return (
      <EmptyState
        icon={"search"}
        title={"Ничего не найдено"}
        description={`По запросу «${query}» нет контактов`}
        mt={48}
      />
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={item => item.id}
      keyboardShouldPersistTaps={"handled"}
      keyboardDismissMode={"on-drag"}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Text textStyle={"Caption_M3"} color={"textSecondary"} pb={8}>
          {`Найдено: ${results.length}`}
        </Text>
      }
      renderItem={({ item }) => (
        <SearchDemoRow contact={item} query={query} onPress={onPick} />
      )}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
});

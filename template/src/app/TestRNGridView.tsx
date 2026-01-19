import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RNGridItem, RNGridView, RNGridViewRef } from "./RNGridView";

// Генерация тестовых данных
const generateTestItems = (count: number, length = 0) => {
  const newItems = [];

  // eslint-disable-next-line no-plusplus
  for (let i = length; i < count + length; i++) {
    newItems.push({
      id: `item_${i}`,
      title: `Item ${i + 1}`,
      description: `This is item number ${i + 1}`,
    });
  }

  return newItems;
};

export const TestRNGridView = () => {
  // Состояния
  const [items, setItems] = useState<RNGridItem[]>(generateTestItems(1000));
  const [loading, setLoading] = useState(false);

  // Refs
  const gridRef = useRef<RNGridViewRef>(null);

  // Конфигурация
  const [config, setConfig] = useState({
    itemHeight: 40,
    inverted: true,
  });

  // Обработчики событий
  const handleEndReached = () => {
    if (loading) return;

    setLoading(true);
    console.log("Loading more items...");

    // Имитация загрузки данных
    setTimeout(() => {
      const newItems = generateTestItems(200, items.length);

      setItems(prev => [...prev, ...newItems]);
      setLoading(false);
      console.log("Added", newItems.length, "more items");
    }, 300);
  };

  const handleItemPress = (item: RNGridItem) => {
    Alert.alert("Item Pressed", `ID: ${item.id}\nTitle: ${item.title}`, [
      { text: "OK" },
    ]);
  };

  const handleScroll = (offset: number) => {
    // Можно использовать для отслеживания позиции скролла
    console.log("Scroll offset:", offset);
  };

  const handleTestInverted = () => {
    setConfig(state => ({ ...state, inverted: !state.inverted }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNGridView
        ref={gridRef}
        items={items}
        {...config}
        hasMoreData={items.length < 800}
        onEndReached={handleEndReached}
        onItemPress={handleItemPress}
        onScroll={handleScroll}
      />

      {/* <FlatList*/}
      {/*  data={items}*/}
      {/*  keyExtractor={item => item.id}*/}
      {/*  // style={{ flex: 1 }}*/}
      {/*  // contentContainerStyle={{ flex: 1 }}*/}
      {/*  renderItem={useMemo(*/}
      {/*    () =>*/}
      {/*      ({ item: { title } }) =>*/}
      {/*        (*/}
      {/*          <View style={{ height: 20 }}>*/}
      {/*            <Text style={{ color: "white" }}>{title}</Text>*/}
      {/*          </View>*/}
      {/*        ),*/}
      {/*    [],*/}
      {/*  )}*/}
      {/* />*/}

      {loading && (
        <View style={styles.loadingOverlay} pointerEvents={"none"}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading more items...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    color: "#495057",
  },
});

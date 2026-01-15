import React, { useRef, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { RNGridItem, RNGridView, RNGridViewRef } from "./RNGridView";

export const TestRNGridView = () => {
  // Состояния
  const [items, setItems] = useState<RNGridItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scrollTargetIndex, setScrollTargetIndex] = useState("");
  const [scrollTargetId, setScrollTargetId] = useState("");
  const [newItemText, setNewItemText] = useState("");

  // Refs
  const gridRef = useRef<RNGridViewRef>(null);
  const scrollToInputRef = useRef(null);

  // Конфигурация
  const [config, setConfig] = useState({
    itemHeight: 40,
    inverted: true,
  });

  // Генерация тестовых данных
  const generateTestItems = (count: number) => {
    const newItems = [];

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < count; i++) {
      newItems.push({
        id: `item_${i}`,
        title: `Item ${items.length + i + 1}`,
        description: `This is item number ${items.length + i + 1}`,
      });
    }

    return newItems;
  };

  // Инициализация данных
  React.useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = () => {
    const initialItems = generateTestItems(50);

    setItems(initialItems);
  };

  // Обработчики событий
  const handleEndReached = () => {
    if (loading) return;

    setLoading(true);
    console.log("Loading more items...");

    // Имитация загрузки данных
    setTimeout(() => {
      const newItems = generateTestItems(200);

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

  // Действия
  const handleAddItem = () => {
    if (!newItemText.trim()) return;

    const newItem = {
      id: `item-${Date.now()}`,
      title: newItemText,
      description: `Custom item: ${newItemText}`,
    };

    setItems(prev => [newItem, ...prev]);
    setNewItemText("");

    // Скролл к новому элементу
    setTimeout(() => {
      gridRef.current?.scrollToIndex(0);
    }, 100);
  };

  const handleScrollToIndex = () => {
    const index = parseInt(scrollTargetIndex);

    if (!isNaN(index) && index >= 0 && index < items.length) {
      gridRef.current?.scrollToIndex(index);
      setScrollTargetIndex("");
    } else {
      Alert.alert("Error", "Please enter a valid index");
    }
  };

  const handleScrollToId = () => {
    if (scrollTargetId.trim()) {
      gridRef.current?.scrollToId(scrollTargetId);
      setScrollTargetId("");
    } else {
      Alert.alert("Error", "Please enter an ID");
    }
  };

  const handleGetOffset = async () => {
    try {
      const result = await gridRef.current?.getScrollOffset();

      Alert.alert(
        "Scroll Offset",
        `Current offset: ${result?.offset.toFixed(2)}`,
      );
    } catch (error) {
      console.error("Error getting offset:", error);
    }
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const handleLoadMore = () => {
    const newItems = generateTestItems(30);

    setItems(prev => [...prev, ...newItems]);
  };

  const handleRemoveFirst = () => {
    if (items.length > 0) {
      setItems(prev => prev.slice(1));
    }
  };

  const handleTestInverted = () => {
    setConfig(state => ({ ...state, inverted: !state.inverted }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Панель управления */}
      <ScrollView
        style={styles.controlsContainer}
        contentContainerStyle={styles.controlsContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>RNGridView Test App</Text>

        {/* Добавление нового элемента */}
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Add New Item</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter item title"
              value={newItemText}
              onChangeText={setNewItemText}
              onSubmitEditing={handleAddItem}
            />
            <TouchableOpacity
              style={[
                styles.button,
                !newItemText.trim() && styles.buttonDisabled,
              ]}
              onPress={handleAddItem}
              disabled={!newItemText.trim()}
            >
              <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Навигация по скроллу */}
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Scroll Navigation</Text>

          <View style={styles.inputRow}>
            <TextInput
              ref={scrollToInputRef}
              style={styles.input}
              placeholder="Scroll to index"
              keyboardType="number-pad"
              value={scrollTargetIndex}
              onChangeText={setScrollTargetIndex}
              onSubmitEditing={handleScrollToIndex}
            />
            <TouchableOpacity
              style={[
                styles.button,
                !scrollTargetIndex && styles.buttonDisabled,
              ]}
              onPress={handleScrollToIndex}
              disabled={!scrollTargetIndex}
            >
              <Text style={styles.buttonText}>Go</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Scroll to ID"
              value={scrollTargetId}
              onChangeText={setScrollTargetId}
              onSubmitEditing={handleScrollToId}
            />
            <TouchableOpacity
              style={[styles.button, !scrollTargetId && styles.buttonDisabled]}
              onPress={handleScrollToId}
              disabled={!scrollTargetId}
            >
              <Text style={styles.buttonText}>Go</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleGetOffset}
          >
            <Text style={styles.buttonText}>Get Scroll Offset</Text>
          </TouchableOpacity>
        </View>

        {/* Управление данными */}
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSmall, styles.buttonPrimary]}
              onPress={loadInitialData}
            >
              <Text style={styles.buttonText}>Load 50 Items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSmall, styles.buttonSuccess]}
              onPress={handleLoadMore}
            >
              <Text style={styles.buttonText}>Load 30 More</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSmall, styles.buttonWarning]}
              onPress={handleRemoveFirst}
            >
              <Text style={styles.buttonText}>Remove First</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSmall, styles.buttonDanger]}
              onPress={handleClearAll}
            >
              <Text style={styles.buttonText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.buttonInfo]}
            onPress={handleTestInverted}
          >
            <Text style={styles.buttonText}>Test Inverted Mode</Text>
          </TouchableOpacity>
        </View>

        {/* Статистика */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Statistics</Text>
          <Text style={styles.statsText}>Total Items: {items.length}</Text>
          <Text style={styles.statsText}>
            Status: {loading ? "Loading..." : "Ready"}
          </Text>
        </View>
      </ScrollView>

      {/* Сам грид */}
      <View style={styles.gridContainer}>
        {items.length > 0 ? (
          <RNGridView
            ref={gridRef}
            items={items}
            {...config}
            hasMoreData={items.length < 800}
            onEndReached={handleEndReached}
            onItemPress={handleItemPress}
            onScroll={handleScroll}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No items to display</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={loadInitialData}
            >
              <Text style={styles.emptyStateButtonText}>Load Items</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Индикатор загрузки */}
      {loading && (
        <View style={styles.loadingOverlay}>
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
    backgroundColor: "#f5f5f5",
  },
  controlsContainer: {
    maxHeight: 300,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  controlsContent: {
    padding: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  controlSection: {
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 60,
  },
  buttonDisabled: {
    backgroundColor: "#6c757d",
    opacity: 0.6,
  },
  buttonSecondary: {
    backgroundColor: "#6c757d",
  },
  buttonPrimary: {
    backgroundColor: "#007bff",
  },
  buttonSuccess: {
    backgroundColor: "#28a745",
  },
  buttonWarning: {
    backgroundColor: "#ffc107",
  },
  buttonDanger: {
    backgroundColor: "#dc3545",
  },
  buttonInfo: {
    backgroundColor: "#17a2b8",
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 0,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: "space-between",
  },
  gridContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  emptyStateText: {
    fontSize: 18,
    color: "#6c757d",
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  emptyStateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    backgroundColor: "#e9ecef",
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
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

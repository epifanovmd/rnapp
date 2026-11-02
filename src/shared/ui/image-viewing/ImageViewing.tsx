import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ImageViewingHeader } from "./components/ImageViewingHeader";
import { ImageViewingItem } from "./components/ImageViewingItem";
import { useImagePrefetch } from "./hooks/use-image-prefetch";
import {
  IImageViewingConfig,
  IImageViewingProps,
  IImageViewingSource,
} from "./image-viewing.types";

const DEFAULT_CONFIG: IImageViewingConfig = {
  maxScale: 6,
  doubleTapScale: 3,
  swipeToCloseEnabled: true,
  doubleTapToZoomEnabled: true,
};

const DEFAULT_BG_COLOR = "#000000";

/**
 * Полноэкранный просмотрщик изображений: нативный горизонтальный pager,
 * зум/закрытие жестами на UI-потоке (use-zoom-gesture), скрываемые бары,
 * префетч соседних изображений. Кастомизация — render-пропсы
 * (renderHeader/renderFooter/renderImage) без замены поведения.
 */
export const ImageViewing: FC<IImageViewingProps> = memo(
  ({
    images,
    imageIndex = 0,
    visible,
    onRequestClose,
    onIndexChange,
    onLongPress,
    keyExtractor,
    backgroundColor = DEFAULT_BG_COLOR,
    renderHeader,
    renderFooter,
    renderImage,
    ...configOverrides
  }) => {
    const { width, height } = useWindowDimensions();
    // Инсеты из контекста приложения: SafeAreaView внутри translucent-Modal
    // на Android измеряется нестабильно (шапка уезжала под статус-бар).
    const insets = useSafeAreaInsets();
    const listRef = useRef<FlatList<IImageViewingSource>>(null);
    const [currentIndex, setCurrentIndex] = useState(imageIndex);
    const [zoomed, setZoomed] = useState(false);
    const [barsVisible, setBarsVisible] = useState(true);

    const dismissProgress = useSharedValue(0);

    const sources = useMemo<IImageViewingSource[]>(
      () =>
        images.map(image =>
          typeof image === "string" ? { uri: image } : image,
        ),
      [images],
    );

    const config = useMemo<IImageViewingConfig>(
      () => ({
        maxScale: configOverrides.maxScale ?? DEFAULT_CONFIG.maxScale,
        doubleTapScale:
          configOverrides.doubleTapScale ?? DEFAULT_CONFIG.doubleTapScale,
        swipeToCloseEnabled:
          configOverrides.swipeToCloseEnabled ??
          DEFAULT_CONFIG.swipeToCloseEnabled,
        doubleTapToZoomEnabled:
          configOverrides.doubleTapToZoomEnabled ??
          DEFAULT_CONFIG.doubleTapToZoomEnabled,
      }),
      [
        configOverrides.maxScale,
        configOverrides.doubleTapScale,
        configOverrides.swipeToCloseEnabled,
        configOverrides.doubleTapToZoomEnabled,
      ],
    );

    useImagePrefetch(sources, currentIndex, visible);

    // Сброс состояния при каждом открытии.
    useEffect(() => {
      if (visible) {
        setCurrentIndex(imageIndex);
        setZoomed(false);
        setBarsVisible(true);
        dismissProgress.value = 0;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    // Поворот экрана: удержать текущий слайд.
    useEffect(() => {
      listRef.current?.scrollToOffset({
        offset: currentIndex * width,
        animated: false,
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [width]);

    const changeIndex = useCallback(
      (index: number) => {
        setCurrentIndex(current => {
          if (current !== index) {
            onIndexChange?.(index);
          }

          return index;
        });
      },
      [onIndexChange],
    );

    const handleMomentumEnd = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);

        changeIndex(Math.min(Math.max(index, 0), sources.length - 1));
      },
      [changeIndex, width, sources.length],
    );

    const toggleBars = useCallback(
      () => setBarsVisible(current => !current),
      [],
    );

    const handleZoomChange = useCallback((value: boolean) => {
      setZoomed(value);
      // Зум скрывает бары, раззум возвращает.
      setBarsVisible(!value);
    }, []);

    const barsProgress = useDerivedValue(() =>
      withTiming(barsVisible ? 1 : 0, { duration: 200 }),
    );

    const backgroundStyle = useAnimatedStyle(() => ({
      opacity: 1 - dismissProgress.value * 0.85,
    }));

    const barsStyle = useAnimatedStyle(() => ({
      opacity: barsProgress.value * (1 - dismissProgress.value * 2),
    }));

    const extractKey = useCallback(
      (image: IImageViewingSource, index: number) =>
        keyExtractor?.(image, index) ?? `${image.uri}-${index}`,
      [keyExtractor],
    );

    const getItemLayout = useCallback(
      (_: unknown, index: number) => ({
        length: width,
        offset: width * index,
        index,
      }),
      [width],
    );

    const renderItem = useCallback(
      ({ item, index }: ListRenderItemInfo<IImageViewingSource>) => (
        <ImageViewingItem
          image={item}
          index={index}
          isActive={index === currentIndex}
          width={width}
          height={height}
          config={config}
          dismissProgress={dismissProgress}
          renderImage={renderImage}
          onZoomChange={handleZoomChange}
          onSingleTap={toggleBars}
          onLongPress={onLongPress}
          onDismiss={onRequestClose}
        />
      ),
      [
        currentIndex,
        width,
        height,
        config,
        dismissProgress,
        renderImage,
        handleZoomChange,
        toggleBars,
        onLongPress,
        onRequestClose,
      ],
    );

    if (!visible) {
      return null;
    }

    const barInfo = {
      index: currentIndex,
      count: sources.length,
      onClose: onRequestClose,
    };

    return (
      <Modal
        visible={visible}
        transparent
        animationType={"fade"}
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={onRequestClose}
        supportedOrientations={["portrait", "landscape"]}
        hardwareAccelerated
      >
        <View style={styles.container}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor },
              backgroundStyle,
            ]}
          />

          <FlatList
            ref={listRef}
            data={sources}
            renderItem={renderItem}
            keyExtractor={extractKey}
            horizontal
            pagingEnabled
            scrollEnabled={!zoomed}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={imageIndex}
            getItemLayout={getItemLayout}
            onMomentumScrollEnd={handleMomentumEnd}
            windowSize={3}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
          />

          <Animated.View
            style={[styles.header, { paddingTop: insets.top }, barsStyle]}
            pointerEvents={barsVisible ? "box-none" : "none"}
          >
            {renderHeader ? (
              renderHeader(barInfo)
            ) : (
              <ImageViewingHeader {...barInfo} />
            )}
          </Animated.View>

          {!!renderFooter && (
            <Animated.View
              style={[
                styles.footer,
                { paddingBottom: insets.bottom },
                barsStyle,
              ]}
              pointerEvents={barsVisible ? "box-none" : "none"}
            >
              {renderFooter(barInfo)}
            </Animated.View>
          )}
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
});

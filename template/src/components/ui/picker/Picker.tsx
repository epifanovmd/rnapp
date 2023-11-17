import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  NativeScrollEvent,
  NativeScrollPoint,
  NativeSyntheticEvent,
  ScrollView,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import RNReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {LayoutChangeEvent} from 'react-native/Libraries/Types/CoreEventTypes';

export interface PickerProps<T> {
  items: T[];
  index?: number;
  visibleItems?: number;
  itemHeight?: number;
  renderItem: (item: T, active: boolean, index: number) => JSX.Element;
  onIndexChange?: (item: T, index: number) => void;
  lineStyle?: ViewStyle;
}

export interface PickerComponent {
  <T extends any>(props: PickerProps<T>): any;
}

export const Picker: PickerComponent = ({
  items,
  index,
  visibleItems = 3,
  itemHeight = 0,
  renderItem,
  onIndexChange,
  lineStyle,
}) => {
  const [selectHeight, setSelectHeight] = useState(itemHeight);

  const intervalFix = useRef<NodeJS.Timeout>();
  const isDrag = useRef<boolean>(false);
  const isPressedValue = useRef<boolean>(false);
  const currentIndexRef = useRef(0);

  const primaryScrollRef = useRef<ScrollView>(null);
  const secondaryScrollRef = useRef<ScrollView>(null);

  const containerHeight = selectHeight * (visibleItems * 2 + 1);
  const auxContainerHeight = (containerHeight - selectHeight) / 2;

  useEffect(() => {
    if (index !== undefined && index !== currentIndexRef.current) {
      isPressedValue.current = true;
      selectTo(index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const selectTo = useCallback(
    (i: number, animated: boolean = true) => {
      const y = i * selectHeight;
      if (primaryScrollRef && primaryScrollRef.current) {
        primaryScrollRef.current.scrollTo({y, animated});
      }
    },
    [selectHeight],
  );

  const onLayoutScrollView = useCallback(() => {
    if (index !== undefined && index !== currentIndexRef.current) {
      isPressedValue.current = true;
      selectTo(index, false);
    }
  }, [index, selectTo]);

  const triggerHapticFeedback = useCallback(() => {
    RNReactNativeHapticFeedback.trigger('effectClick', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: true,
    });
  }, []);

  const onPressValue = useCallback(
    (i: number) => () => {
      if (i !== index) {
        isPressedValue.current = true;
        selectTo(i);
        triggerHapticFeedback();
      }
    },
    [index, selectTo, triggerHapticFeedback],
  );

  const itemContainerStyle: ViewStyle = useMemo(
    () => ({
      justifyContent: 'center',
      alignItems: 'center',
      height: selectHeight ? selectHeight : undefined,
    }),
    [selectHeight],
  );

  const onLayoutItem = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      if ((!selectHeight || height > selectHeight) && !itemHeight) {
        setSelectHeight(height);
      }
    },
    [itemHeight, selectHeight],
  );

  const getItem = useCallback(
    (active: boolean) => {
      if (items.length === 0) {
        return null;
      }

      return items.map((item, i) => {
        return (
          <TouchableOpacity
            onLayout={onLayoutItem}
            onPress={onPressValue(i)}
            key={i}
            style={itemContainerStyle}>
            {renderItem(item, active, i)}
          </TouchableOpacity>
        );
      });
    },
    [itemContainerStyle, items, onLayoutItem, onPressValue, renderItem],
  );

  const getScrollIndex = useCallback(
    (scrollY: NativeScrollPoint['y']) => {
      const y = Math.round(scrollY);
      return Math.round(y / selectHeight);
    },
    [selectHeight],
  );

  const checkIntervalFix = useCallback(() => {
    if (intervalFix && intervalFix.current) {
      clearInterval(intervalFix.current);
    }
  }, []);

  const hapticScrollFeedback = useCallback(
    (currentIndex: number) => {
      if (
        currentIndex !== currentIndexRef.current &&
        (!isPressedValue.current || isDrag.current)
      ) {
        triggerHapticFeedback();
      }
    },
    [triggerHapticFeedback],
  );

  const debounceIndexChange = useCallback(
    (currentIndex: number) => {
      checkIntervalFix();
      intervalFix.current = setTimeout(() => {
        if (onIndexChange && !isDrag.current && index !== currentIndex) {
          onIndexChange(items[currentIndex], currentIndex);
        }
      }, 50);
    },
    [checkIntervalFix, index, items, onIndexChange],
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const currentIndex = getScrollIndex(y);

      if (secondaryScrollRef && secondaryScrollRef.current) {
        secondaryScrollRef.current.scrollTo({y, animated: false});
      }

      debounceIndexChange(currentIndex);
      hapticScrollFeedback(currentIndex);

      currentIndexRef.current = currentIndex;
    },
    [debounceIndexChange, getScrollIndex, hapticScrollFeedback],
  );

  const snapToOffsets = useMemo(
    () => items.map((item, i) => selectHeight * i),
    [items, selectHeight],
  );

  const containerStyle = useMemo(
    () => ({height: containerHeight, flex: 1}),
    [containerHeight],
  );

  const primaryPosition: ViewStyle = useMemo(
    () => ({
      width: '100%',
      height: containerHeight,
    }),
    [containerHeight],
  );

  const secondaryPosition: ViewStyle = useMemo(
    () => ({
      backgroundColor: 'gray',
      ...lineStyle,
      height: selectHeight,
      marginTop: -(containerHeight / 2 + selectHeight / 2),
    }),
    [containerHeight, selectHeight, lineStyle],
  );

  const onScrollBeginDrag = useCallback(() => {
    isDrag.current = true;
  }, []);
  const onScrollEndDrag = useCallback(() => {
    isDrag.current = false;
    isPressedValue.current = false;
  }, []);

  return (
    <View style={containerStyle}>
      <View style={primaryPosition}>
        <ScrollView
          onLayout={onLayoutScrollView}
          ref={primaryScrollRef}
          bounces={false}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          decelerationRate={'fast'}
          scrollEventThrottle={16}
          snapToInterval={selectHeight}
          nestedScrollEnabled={false}
          snapToAlignment={'center'}
          snapToOffsets={snapToOffsets}>
          <View style={{height: auxContainerHeight}} />
          {getItem(false)}
          <View style={{height: auxContainerHeight}} />
        </ScrollView>
      </View>
      <View style={secondaryPosition} pointerEvents="none">
        <ScrollView
          showsVerticalScrollIndicator={false}
          ref={secondaryScrollRef}
          scrollEnabled={false}
          scrollEventThrottle={16}>
          {getItem(true)}
        </ScrollView>
      </View>
    </View>
  );
};
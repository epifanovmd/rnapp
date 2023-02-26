import React, {FC, memo, useCallback, useMemo, useRef, useState} from 'react';
import {Animated, ListRenderItemInfo} from 'react-native';
import {FlexView} from '../../elements';
import {CarouselItem} from './CarouselItem';
import {LayoutChangeEvent} from 'react-native/Libraries/Types/CoreEventTypes';
import {FlatListProps} from 'react-native/Libraries/Lists/FlatList';
import {Touchable} from '../touchable';

export interface ICarouselProps<T = any>
  extends Omit<
    FlatListProps<T>,
    | 'ListEmptyComponent'
    | 'ListFooterComponent'
    | 'ListHeaderComponent'
    | 'renderItem'
  > {
  renderItem?: (info?: ListRenderItemInfo<T>) => React.ReactElement | null;
  width?: number;
  height?: number;
  onPress?: () => void;
}

export interface CarouselFC<P = any> {
  <T>(props: ICarouselProps<P extends never ? T : P>): ReturnType<FC>;
}

export const Carousel: CarouselFC = memo(
  ({renderItem, data, height, width, onPress, ...rest}) => {
    const [_width, setWidth] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    const _renderItem = useCallback(
      (item: ListRenderItemInfo<any>) => {
        return (
          <CarouselItem width={_width} height={height}>
            <Touchable flex={1} onPress={onPress} disabled={!onPress}>
              {renderItem?.(item)}
            </Touchable>
          </CarouselItem>
        );
      },
      [renderItem, height, onPress, _width],
    );

    const onLayout = useCallback((event: LayoutChangeEvent) => {
      setWidth(event.nativeEvent.layout.width);
    }, []);

    const renderEmpty = useMemo(
      () =>
        renderItem ? (
          <CarouselItem width={_width} height={height}>
            <Touchable flex={1} onPress={onPress} disabled={!onPress}>
              {renderItem?.()}
            </Touchable>
          </CarouselItem>
        ) : undefined,
      [_width, height, onPress, renderItem],
    );

    return (
      <FlexView onLayout={onLayout} height={height} width={width}>
        <Animated.FlatList<any>
          data={data}
          renderItem={_renderItem}
          horizontal={true}
          pagingEnabled={true}
          {...rest}
          ListEmptyComponent={renderEmpty}
          scrollEventThrottle={32}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {x: scrollX}}}],
            {useNativeDriver: true},
          )}
          showsHorizontalScrollIndicator={false}
        />
      </FlexView>
    );
  },
);

import React, {FC, memo, useCallback, useRef, useState} from 'react';
import {Animated, ListRenderItemInfo} from 'react-native';
import {FlexView} from '../../elements';
import {CarouselItem} from './CarouselItem';
import {LayoutChangeEvent} from 'react-native/Libraries/Types/CoreEventTypes';
import {FlatListProps} from 'react-native/Libraries/Lists/FlatList';

interface IProps<T = any> extends FlatListProps<T> {
  width?: number;
  height?: number;
}

interface GenericFC {
  <T extends any = any>(props: IProps<T>): ReturnType<FC>;
}

export const Carousel: GenericFC = memo(
  ({renderItem, data, height, width, ...rest}) => {
    const [_width, setWidth] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    const _renderItem = useCallback(
      (item: ListRenderItemInfo<any>) => {
        return (
          <CarouselItem width={width ?? _width} height={height}>
            {renderItem?.(item)}
          </CarouselItem>
        );
      },
      [renderItem, height, _width, width],
    );

    const onLayout = useCallback((event: LayoutChangeEvent) => {
      setWidth(event.nativeEvent.layout.width);
    }, []);

    return (
      <FlexView onLayout={onLayout}>
        <Animated.FlatList<any>
          data={data}
          renderItem={_renderItem}
          horizontal={true}
          pagingEnabled={true}
          {...rest}
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

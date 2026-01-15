// types.ts
export interface RNGridItem {
  id: string;
  title: string;
}

export interface RNGridViewProps extends ViewProps {
  items: RNGridItem[];

  itemHeight?: number;
  verticalSpacing?: number;
  horizontalInset?: number;
  inverted?: boolean;
  showsScrollIndicator?: boolean;
  bounces?: boolean;
  initialScrollIndex?: number;
  initialScrollId?: string;
  initialScrollOffset?: number;

  hasMoreData?: boolean;
  endReachedThreshold?: number;
  onEndReached?: () => void;
  onItemPress?: (item: RNGridItem) => void;
  onScroll?: (offset: number) => void;
  onMomentumScrollStart?: () => void;
  onMomentumScrollEnd?: () => void;
}

export interface RNGridViewRef {
  scrollToIndex: (index: number, animated?: boolean) => void;
  scrollToId: (id: string, animated?: boolean) => void;
  getScrollOffset: () => Promise<{ offset: number }>;
}

// RNGridView.tsx
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import {
  findNodeHandle,
  NativeModules,
  requireNativeComponent,
  StyleProp,
  ViewProps,
  ViewStyle,
} from "react-native";

const RNGridViewNative = requireNativeComponent<
  RNGridViewProps & { ref?: any }
>("RNGridView");
const RNGridViewManager = NativeModules.RNGridViewManager;

export const RNGridView = forwardRef<RNGridViewRef, RNGridViewProps>(
  (props, ref) => {
    const nativeRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      scrollToIndex: (index: number, animated: boolean = true) => {
        if (nativeRef.current) {
          const handle = findNodeHandle(nativeRef.current);

          RNGridViewManager.scrollToIndex(handle, index, animated);
        }
      },

      scrollToId: (id: string, animated: boolean = true) => {
        if (nativeRef.current) {
          const handle = findNodeHandle(nativeRef.current);

          RNGridViewManager.scrollToId(handle, id, animated);
        }
      },

      getScrollOffset: async () => {
        if (nativeRef.current) {
          const handle = findNodeHandle(nativeRef.current);

          return await RNGridViewManager.getScrollOffset(handle);
        }

        return { offset: 0 };
      },
    }));

    const handleItemPress = (event: any) => {
      props.onItemPress?.(event.nativeEvent);
    };

    const handleScroll = (event: any) => {
      props.onScroll?.(event.nativeEvent.offset);
    };

    return (
      <RNGridViewNative
        ref={nativeRef}
        {...props}
        onEndReached={props.onEndReached}
        onItemPress={handleItemPress}
        onScroll={handleScroll}
        style={[{ flex: 1 }, props.style]}
      />
    );
  },
);

RNGridView.displayName = "RNGridView";

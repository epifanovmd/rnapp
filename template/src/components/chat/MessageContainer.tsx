import { mergeRefs } from "@force-dev/react";
import { ViewabilityConfig } from "@react-native/virtualized-lists";
import {
  FlashList,
  FlashListProps,
  FlashListRef,
  ListRenderItemInfo,
} from "@shopify/flash-list";
import React, {
  forwardRef,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ColorValue,
  DimensionValue,
  LayoutChangeEvent,
  Platform,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { useChatTheme } from "./ChatThemeProvider";
import { LoadEarlier, LoadEarlierProps } from "./LoadEarlier";
import { Message, MessageProps } from "./Message";
import { IMessage, User } from "./types";

const AnimatedFlashList = Animated.createAnimatedComponent<
  FlashListProps<IMessage> & { ref?: React.Ref<FlashListRef<IMessage>> }
>(FlashList);

const viewabilityConfig: ViewabilityConfig = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 150,
};

const maintainVisibleContentPosition = {
  autoscrollToBottomThreshold: 0.01,
  animateAutoScrollToBottom: false,
  startRenderingFromBottom: true,
};

export interface MessageContainerProps
  extends Pick<
    MessageProps,
    | "showUserAvatar"
    | "dateFormat"
    | "renderAvatarOnTop"
    | "showAvatarForEveryMessage"
    | "replyIconColor"
    | "renderBubble"
    | "onPressAvatar"
    | "onLongPressAvatar"
    | "renderDay"
    | "renderSystemMessage"
    | "renderAvatar"
    // Bubble props
    | "showUsernameOnMessage"
    | "parsePatterns"
    | "imageProps"
    | "imageStyle"
    | "timeFormat"
    | "timeTextStyle"
    | "onPress"
    | "onLongPress"
    | "onReply"
    | "renderMessageImage"
    | "renderMessageVideo"
    | "renderMessageAudio"
    | "renderMessageText"
    | "renderTime"
    | "renderTicks"
    | "renderUsername"
    | "renderReplyIcon"
  > {
  user: User;
  messages?: IMessage[];

  // Settings
  extraData?: any;
  inverted?: boolean;
  loadEarlier?: boolean;
  scrollToBottom?: boolean;
  scrollToBottomOffset?: number;
  infiniteScroll?: boolean;
  isLoadingEarlier?: boolean;
  listViewProps: Omit<
    FlashListProps<IMessage>,
    | "data"
    | "renderItem"
    | "extraData"
    | "ListEmptyComponent"
    | "ListFooterComponent"
    | "ListHeaderComponent"
    | "onLayout"
    | "onEndReached"
    | "CellRendererComponent"
  >;
  scrollToBottomStyle?: StyleProp<ViewStyle>;

  // Handlers
  onLoadEarlier?: () => void;
  onViewableMessages?: (messages: IMessage[]) => void;

  // Renders
  renderScrollToBottomIcon?: (fill: ColorValue) => React.ReactElement | null;
  renderChatEmpty?: (props: MessageContainerProps) => React.ReactElement | null;
  renderFooter?: (props: MessageContainerProps) => React.ReactElement | null;
  renderMessage?: (props: MessageProps) => React.ReactElement | null;
  renderLoadEarlier?: (props: LoadEarlierProps) => React.ReactElement | null;
}

const keyExtractor = (_item: IMessage) => _item.id;

export const MessageContainer = memo(
  forwardRef<FlashListRef<IMessage>, MessageContainerProps>((props, ref) => {
    const {
      user,
      messages,
      extraData,
      inverted,
      loadEarlier,
      scrollToBottom,
      scrollToBottomOffset = 60,
      infiniteScroll,
      isLoadingEarlier,
      listViewProps,
      scrollToBottomStyle,
      onLoadEarlier,
      onViewableMessages,
      renderScrollToBottomIcon,
      renderChatEmpty,
      renderFooter,
      renderMessage,
      renderLoadEarlier,

      // MessageProps
      showUserAvatar,
      dateFormat,
      renderAvatarOnTop,
      showAvatarForEveryMessage,
      onPressAvatar,
      onLongPressAvatar,
      onReply,
      renderBubble,
      renderDay,
      renderSystemMessage,
      renderAvatar,

      // Bubble props
      showUsernameOnMessage,
      parsePatterns,
      imageProps,
      imageStyle,
      timeFormat,
      timeTextStyle,
      onPress,
      onLongPress,
      renderMessageImage,
      renderMessageVideo,
      renderMessageAudio,
      renderMessageText,
      renderTime,
      renderTicks,
      renderUsername,
      renderReplyIcon,
    } = props;

    const _ref = useRef<FlashListRef<IMessage>>(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const scrollY = useSharedValue(0);
    const contentHeight = useSharedValue(0);
    const listHeight = useSharedValue(0);
    const [containerHeight, setContainerHeight] =
      useState<DimensionValue>("auto");

    const theme = useChatTheme();

    const _scrollToBottom = useCallback(
      (animated: boolean = true) => {
        if (inverted) {
          _ref.current?.scrollToEnd({ animated });
        } else if (_ref.current) {
          _ref.current.scrollToTop({ animated });
        }
      },
      [inverted],
    );

    const onLoadMore = useCallback(() => {
      if (infiniteScroll && loadEarlier && onLoadEarlier && !isLoadingEarlier) {
        onLoadEarlier();
      }
    }, [infiniteScroll, isLoadingEarlier, loadEarlier, onLoadEarlier]);

    const _renderFooter = useMemo(() => {
      if (renderFooter) {
        return renderFooter(props);
      }

      return null;
    }, [props, renderFooter]);

    const _renderLoadEarlier = useCallback(() => {
      if (loadEarlier) {
        const loadEarlierProps: LoadEarlierProps = {
          isLoadingEarlier,
          onLoadEarlier,
        };

        if (renderLoadEarlier) {
          return renderLoadEarlier(loadEarlierProps);
        }

        return <LoadEarlier {...loadEarlierProps} />;
      }

      return null;
    }, [isLoadingEarlier, loadEarlier, onLoadEarlier, renderLoadEarlier]);

    const _renderChatEmpty = useCallback(() => {
      if (renderChatEmpty) {
        return (
          <View
            style={{
              minHeight: containerHeight,
            }}
          >
            {!inverted ? (
              renderChatEmpty(props)
            ) : (
              <View style={styles.emptyChatContainer}>
                {renderChatEmpty(props)}
              </View>
            )}
          </View>
        );
      }

      return <View style={styles.container} />;
    }, [containerHeight, inverted, props, renderChatEmpty]);

    const _renderHeader = useMemo(
      () => <View style={styles.headerWrapper}>{_renderLoadEarlier()}</View>,
      [_renderLoadEarlier],
    );

    const _renderScrollBottomComponent = useCallback(() => {
      if (renderScrollToBottomIcon) {
        return renderScrollToBottomIcon(theme.scrollToBottomIconFill);
      }

      return (
        <Svg
          viewBox="0 0 24 24"
          height={24}
          width={24}
          fill={theme.scrollToBottomIconFill}
        >
          <Path d="M7.41 8.58008L12 13.1701L16.59 8.58008L18 10.0001L12 16.0001L6 10.0001L7.41 8.58008Z" />
        </Svg>
      );
    }, [renderScrollToBottomIcon, theme.scrollToBottomIconFill]);

    const _renderScrollToBottomWrapper = useCallback(() => {
      return (
        <View
          style={[
            styles.scrollToBottomStyle,
            {
              backgroundColor: theme.scrollToBottomBackground,
              shadowColor: theme.scrollToBottomShadowColor,
            },
            scrollToBottomStyle,
          ]}
        >
          <TouchableOpacity
            onPress={() => _scrollToBottom()}
            hitSlop={{ top: 5, left: 5, right: 5, bottom: 5 }}
          >
            {_renderScrollBottomComponent()}
          </TouchableOpacity>
        </View>
      );
    }, [
      _renderScrollBottomComponent,
      _scrollToBottom,
      scrollToBottomStyle,
      theme.scrollToBottomBackground,
      theme.scrollToBottomShadowColor,
    ]);

    const _renderRow = useCallback(
      ({
        item,
        index,
      }: ListRenderItemInfo<IMessage>): React.ReactElement | null => {
        if (messages && user) {
          const previousMessage = messages[index - 1] || {};
          const nextMessage = messages[index + 1] || {};

          const messageProps: MessageProps = {
            user,
            currentMessage: item,
            nextMessage,
            previousMessage,
            position: item.user.id === user.id ? "right" : "left",
            showUserAvatar,
            dateFormat,
            renderAvatarOnTop,
            showAvatarForEveryMessage,
            inverted,

            onPress,
            onLongPress,
            onPressAvatar,
            onLongPressAvatar,
            onReply,
            renderBubble,
            renderDay,
            renderSystemMessage,
            renderAvatar,
            renderReplyIcon,

            // Bubble props
            showUsernameOnMessage,
            parsePatterns,
            imageProps,
            imageStyle,
            timeFormat,
            timeTextStyle,
            renderMessageImage,
            renderMessageVideo,
            renderMessageAudio,
            renderMessageText,
            renderTime,
            renderTicks,
            renderUsername,
          };

          if (renderMessage) {
            return renderMessage(messageProps);
          }

          return (
            <Message
              replyIconColor={
                messageProps.replyIconColor ?? theme.replyIconColor
              }
              {...messageProps}
            />
          );
        }

        return <View />;
      },
      [
        dateFormat,
        imageProps,
        imageStyle,
        inverted,
        messages,
        onLongPress,
        onLongPressAvatar,
        onPress,
        onPressAvatar,
        onReply,
        parsePatterns,
        renderAvatar,
        renderAvatarOnTop,
        renderBubble,
        renderDay,
        renderMessage,
        renderMessageAudio,
        renderMessageImage,
        renderMessageText,
        renderMessageVideo,
        renderReplyIcon,
        renderSystemMessage,
        renderTicks,
        renderTime,
        renderUsername,
        showAvatarForEveryMessage,
        showUserAvatar,
        showUsernameOnMessage,
        theme.replyIconColor,
        timeFormat,
        timeTextStyle,
        user,
      ],
    );

    const scrollEvent = useAnimatedScrollHandler({
      onScroll: event => {
        scrollY.value = event.contentOffset.y;
        contentHeight.value = event.contentSize.height;
        listHeight.value = event.layoutMeasurement.height;
      },
    });

    const showScrollBottomDv = useDerivedValue(() => {
      const visibleScroll = inverted
        ? contentHeight.value - listHeight.value - scrollY.value
        : scrollY.value;

      return visibleScroll > scrollToBottomOffset;
    });

    useAnimatedReaction(
      () => showScrollBottomDv.value,
      shouldShow => {
        runOnJS(setShowScrollBottom)(shouldShow);
      },
    );

    const onViewableItemsChanged = useCallback(
      ({
        viewableItems,
      }: {
        viewableItems: {
          item: IMessage;
          key: string;
          index: number | null;
          isViewable: boolean;
        }[];
        changed: {
          item: IMessage;
          key: string;
          index: number | null;
          isViewable: boolean;
        }[];
      }) => {
        const items = viewableItems
          .filter(item => item.isViewable && !item.item.received)
          .map(({ item }) => item);

        onViewableMessages?.(items);
      },
      [onViewableMessages],
    );

    const _maintainVisibleContentPosition = useMemo(
      () => (inverted ? maintainVisibleContentPosition : undefined),
      [inverted],
    );

    const handleLayout = useCallback(
      ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
        setContainerHeight(layout.height);
      },
      [],
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const refs = useMemo(() => mergeRefs([ref, _ref]), []);

    return (
      <View style={styles.container} onLayout={handleLayout}>
        <AnimatedFlashList
          ref={refs}
          extraData={extraData}
          keyExtractor={keyExtractor}
          automaticallyAdjustContentInsets={false}
          maintainVisibleContentPosition={_maintainVisibleContentPosition}
          data={messages}
          renderItem={_renderRow}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={_renderChatEmpty}
          ListFooterComponent={inverted ? _renderHeader : _renderFooter}
          ListHeaderComponent={inverted ? _renderFooter : _renderHeader}
          onScroll={scrollEvent}
          onStartReached={inverted ? onLoadMore : undefined}
          onEndReached={inverted ? undefined : onLoadMore}
          onStartReachedThreshold={1}
          onEndReachedThreshold={1}
          viewabilityConfig={onViewableMessages ? viewabilityConfig : undefined}
          onViewableItemsChanged={onViewableItemsChanged}
          {...listViewProps}
        />
        {showScrollBottom && scrollToBottom && _renderScrollToBottomWrapper()}
      </View>
    );
  }),
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyChatContainer: {
    flex: 1,
    transform: Platform.select({
      android: [{ scaleX: -1 }, { scaleY: -1 }],
      default: [{ scaleY: -1 }],
    }),
  },
  headerWrapper: {
    flex: 1,
  },
  scrollToBottomStyle: {
    opacity: 0.8,
    position: "absolute",
    right: 10,
    bottom: 30,
    zIndex: 999,
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 1,
  },
});

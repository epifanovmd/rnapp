import { mergeRefs } from "@force-dev/react";
import { ViewabilityConfig } from "@react-native/virtualized-lists";
import {
  FlashList,
  FlashListProps,
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
  Platform,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { useChatTheme } from "./ChatThemeProvider";
import { LoadEarlier, LoadEarlierProps } from "./LoadEarlier";
import { Message, MessageProps } from "./Message";
import { IMessage, User } from "./types";

const AnimatedFlashList =
  Animated.createAnimatedComponent<FlashListProps<IMessage>>(FlashList);

const viewabilityConfig: ViewabilityConfig = {
  itemVisiblePercentThreshold: 60,
  minimumViewTime: 250,
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

const keyExtractor = (_item: IMessage, index: number) => `${index}`;

export const MessageContainer = memo(
  forwardRef<FlashList<IMessage>, MessageContainerProps>((props, ref) => {
    const {
      user,
      messages,
      extraData,
      inverted,
      loadEarlier,
      scrollToBottom,
      scrollToBottomOffset = 200,
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

    const _ref = useRef<FlashList<IMessage>>(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const loadedEarlier = useSharedValue(false);
    const scrollContentHeight = useSharedValue(0);
    const [containerHeight, setContainerHeight] =
      useState<DimensionValue>("auto");

    const theme = useChatTheme();

    const _scrollTo = useCallback(
      (options: { animated?: boolean; offset: number }) => {
        if (_ref.current && options) {
          _ref.current.scrollToOffset(options);
        }
      },
      [],
    );

    const _scrollToBottom = useCallback(
      (animated: boolean = true) => {
        if (inverted) {
          _scrollTo({ offset: 0, animated });
        } else if (_ref.current) {
          _ref.current!.scrollToEnd({ animated });
        }
      },
      [_scrollTo, inverted],
    );

    const onLayoutList = useCallback(() => {
      if (!inverted && !!messages && messages?.length) {
        setTimeout(
          () => scrollToBottom && _scrollToBottom(false),
          15 * messages.length,
        );
      }
    }, [_scrollToBottom, inverted, messages, scrollToBottom]);

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
          const previousMessage =
            (inverted ? messages[index + 1] : messages[index - 1]) || {};
          const nextMessage =
            (inverted ? messages[index - 1] : messages[index + 1]) || {};

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

    const scrollEvent = useAnimatedScrollHandler(
      {
        onScroll: event => {
          const contentHeight =
            event.contentSize.height - event.layoutMeasurement.height;

          const contentOffsetY = event.contentOffset?.y ?? 0;

          if (scrollContentHeight.value < contentHeight) {
            scrollContentHeight.value = contentHeight;
            loadedEarlier.value = false;
          } else if (
            !loadedEarlier.value &&
            contentOffsetY > contentHeight / 1.6
          ) {
            loadedEarlier.value = true;
            runOnJS(onLoadMore)();
          }

          if (inverted) {
            runOnJS(setShowScrollBottom)(contentOffsetY > scrollToBottomOffset);
          } else {
            runOnJS(setShowScrollBottom)(
              contentOffsetY < scrollToBottomOffset &&
                contentHeight > scrollToBottomOffset,
            );
          }
        },
      },
      [onLoadMore, inverted],
    );

    const onViewableItemsChanged = useCallback(
      ({
        changed,
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
        const items = changed
          .filter(item => item.isViewable)
          .map(({ item }) => item);

        onViewableMessages?.(items);
      },
      [onViewableMessages],
    );

    return (
      <View
        style={styles.container}
        onLayout={({ nativeEvent: { layout } }) => {
          setContainerHeight(layout.height);
        }}
      >
        <AnimatedFlashList
          ref={mergeRefs([ref, _ref])}
          extraData={extraData}
          keyExtractor={keyExtractor}
          automaticallyAdjustContentInsets={false}
          inverted={inverted}
          data={messages}
          renderItem={_renderRow}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={43}
          ListEmptyComponent={_renderChatEmpty}
          ListFooterComponent={inverted ? _renderHeader : _renderFooter}
          ListHeaderComponent={inverted ? _renderFooter : _renderHeader}
          onScroll={scrollEvent}
          onLayout={onLayoutList}
          viewabilityConfig={viewabilityConfig}
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

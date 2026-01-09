import { FlashListProps, FlashListRef } from "@shopify/flash-list";
import React, {
  createRef,
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ColorValue,
  FlatList,
  ImageProps,
  ImageStyle,
  Insets,
  Platform,
  StyleProp,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { ParsedTextProps } from "react-native-parsed-text";
import { generate } from "shortid";

import { attachButtonProps } from "./AttachButton";
import { AvatarProps } from "./Avatar";
import { BubbleProps } from "./Bubble";
import { ChatInputProps } from "./ChatInput";
import { useChatTheme } from "./ChatThemeProvider";
import { DayProps } from "./Day";
import { InputToolbar, InputToolbarProps } from "./InputToolbar";
import { LoadEarlierProps } from "./LoadEarlier";
import { MessageProps } from "./Message";
import { MessageAudioProps } from "./MessageAudio";
import { MessageContainer, MessageContainerProps } from "./MessageContainer";
import { MessageImageProps } from "./MessageImage";
import { MessageTextProps } from "./MessageText";
import { MessageVideoProps } from "./MessageVideo";
import { ReplyContainer, ReplyContainerProps } from "./ReplyContainer";
import { SendButtonProps } from "./SendButton";
import { SystemMessageProps } from "./SystemMessage";
import { TimeProps } from "./Time";
import { IMessage, LeftRightStyle, User } from "./types";

export interface ChatProps {
  extraData?: any;

  user: User;
  messages?: IMessage[];
  text?: string;

  loading?: boolean;
  loadEarlier?: boolean;
  isLoadingEarlier?: boolean;

  // refs
  messageContainerRef?: React.RefObject<FlatList<IMessage>>;
  textInputRef?: React.RefObject<TextInput>;

  // settings
  insets?: Insets;
  scrollToBottom?: boolean;
  scrollToBottomOffset?: number;
  initialText?: string;
  placeholder?: string;
  disable?: boolean;
  timeFormat?: string;
  dateFormat?: string;
  showUserAvatar?: boolean;
  showAvatarForEveryMessage?: boolean;
  showUsernameOnMessage?: boolean;
  replyIconColor?: ColorValue;
  renderAvatarOnTop?: boolean;
  inverted?: boolean;
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
  maxInputLength?: number;
  alwaysShowSend?: boolean;
  maxInputHeight?: number;
  infiniteScroll?: boolean;

  // props
  imageProps?: ImageProps;
  listViewProps?: Partial<FlashListProps<IMessage>>;
  textInputProps?: ChatInputProps;

  // styles
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  timeTextStyle?: LeftRightStyle<TextStyle>;
  scrollToBottomStyle?: StyleProp<ViewStyle>;

  // utils
  messageIdGenerator?: (message?: IMessage) => string;

  parsePatterns?: (linkStyle: StyleProp<TextStyle>) => ParsedTextProps["parse"];

  // handlers
  onPressAttachButton?: () => void;
  onInputTextChanged?: (text: string) => void;
  onSend?: (messages: IMessage) => void;
  onPress?: (message: IMessage) => void;
  onLongPress?: (message: IMessage) => void;
  onPressAvatar?: (user: User) => void;
  onLongPressAvatar?: (user: User) => void;
  onLoadEarlier?: () => void;
  onViewableMessages?: (messages: IMessage[]) => void;
  onReply?: (message: IMessage) => void;

  // render functions
  renderAvatar?: (props: AvatarProps) => React.ReactElement | null;
  renderLoading?: () => React.ReactElement | null;
  renderLoadEarlier?: (props: LoadEarlierProps) => React.ReactElement | null;
  renderReplyIcon?: () => React.JSX.Element | null;
  renderBubble?: (props: BubbleProps) => React.ReactElement | null;
  renderSystemMessage?: (
    props: SystemMessageProps,
  ) => React.ReactElement | null;
  renderUsername?: (user: User) => React.ReactElement | null;
  renderMessage?: (message: MessageProps) => React.ReactElement | null;
  renderMessageText?: (
    messageText: MessageTextProps,
  ) => React.ReactElement | null;
  renderMessageImage?: (props: MessageImageProps) => React.ReactElement | null;
  renderMessageVideo?: (props: MessageVideoProps) => React.ReactElement | null;
  renderMessageAudio?: (props: MessageAudioProps) => React.ReactElement | null;
  renderDay?: (props: DayProps) => React.ReactElement | null;
  renderTime?: (props: TimeProps) => React.ReactElement | null;
  renderTicks?: (currentMessage: IMessage) => React.ReactElement | null;
  renderFooter?: (props: MessageContainerProps) => React.ReactElement | null;
  renderChatEmpty?: (props: MessageContainerProps) => React.ReactElement | null;
  renderChatFooter?: () => React.ReactElement | null;
  renderInputToolbar?: (props: InputToolbarProps) => React.ReactElement | null;
  renderInput?: (props: ChatInputProps) => React.ReactElement | null;
  renderRecordVoice?: () => React.ReactElement | null;
  renderActionButton?: (props: attachButtonProps) => React.ReactElement | null;
  renderActionButtonIcon?: (fill: string) => React.ReactElement | null;
  renderSendButtonIcon?: (fill: string) => React.ReactElement | null;
  renderSend?: (props: SendButtonProps) => React.ReactElement | null;
  renderScrollToBottomIcon?: () => React.ReactElement | null;
  renderResetReplyIcon?: () => React.ReactElement | null;
  renderReplyContainer?: (
    props: ReplyContainerProps,
  ) => React.ReactElement | null;
}

export const Chat: FC<ChatProps> = memo(
  ({
    extraData,
    user,
    messages = [],
    text,

    loading,
    loadEarlier,
    isLoadingEarlier,

    messageContainerRef = createRef<FlatList<IMessage>>(),
    textInputRef = createRef<TextInput>(),

    insets,
    scrollToBottom,
    scrollToBottomOffset,
    initialText = "",
    placeholder,
    disable,
    timeFormat,
    dateFormat,
    showUserAvatar,
    showAvatarForEveryMessage,
    showUsernameOnMessage,
    replyIconColor,
    renderAvatarOnTop,
    inverted = true,
    keyboardShouldPersistTaps = "handled",
    maxInputLength,
    alwaysShowSend,
    maxInputHeight = 166,
    infiniteScroll,

    imageProps,
    listViewProps,
    textInputProps,

    containerStyle,
    imageStyle,
    timeTextStyle,
    scrollToBottomStyle,

    messageIdGenerator = () => generate(),
    parsePatterns,

    onPressAttachButton,
    onInputTextChanged,
    onSend,
    onPress,
    onLongPress,
    onPressAvatar,
    onLongPressAvatar,
    onLoadEarlier,
    onViewableMessages,
    onReply,

    renderAvatar,
    renderLoading,
    renderLoadEarlier,
    renderReplyIcon,
    renderBubble,
    renderSystemMessage,
    renderUsername,
    renderMessage,
    renderMessageText,
    renderMessageImage,
    renderMessageVideo,
    renderMessageAudio,
    renderDay,
    renderTime,
    renderTicks,
    renderFooter,
    renderChatEmpty,
    renderChatFooter,
    renderInputToolbar,
    renderInput,
    renderRecordVoice,
    renderActionButton,
    renderActionButtonIcon,
    renderSendButtonIcon,
    renderSend,
    renderScrollToBottomIcon,
    renderResetReplyIcon,
    renderReplyContainer,
  }) => {
    const flashListRef = useRef<FlashListRef<IMessage>>(null);
    const isMountedRef = useRef(false);
    const [replyMessage, setReplyMessage] = useState<IMessage | undefined>(
      undefined,
    );

    const [inputValue, setInputValue] = useState<string>(initialText);

    const theme = useChatTheme();

    useEffect(() => {
      isMountedRef.current = true;

      setInputValue(
        text !== undefined && text !== inputValue ? text : inputValue,
      );

      if (!inverted && messages?.length) {
        setTimeout(() => onscrollToBottom(false), 200);
      }

      return () => {
        isMountedRef.current = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text]);

    const getTextFromProp = useCallback(
      (fallback: string = "") => {
        if (text === undefined) {
          return fallback;
        }

        return text;
      },
      [text],
    );

    const onscrollToBottom = useCallback(
      (animated = true) => {
        if (messageContainerRef?.current) {
          if (!inverted) {
            messageContainerRef.current.scrollToEnd({ animated });
          } else {
            messageContainerRef.current.scrollToOffset({
              offset: 0,
              animated,
            });
          }
        }
      },
      [inverted, messageContainerRef],
    );

    const _renderChatFooter = useCallback(() => {
      if (renderChatFooter) {
        return renderChatFooter();
      }

      return null;
    }, [renderChatFooter]);

    const notifyInputTextReset = useCallback(() => {
      if (onInputTextChanged) {
        onInputTextChanged("");
      }
    }, [onInputTextChanged]);

    const resetInputToolbar = useCallback(() => {
      if (textInputRef.current) {
        textInputRef.current.clear();
      }

      notifyInputTextReset();

      setInputValue(getTextFromProp(""));
    }, [getTextFromProp, notifyInputTextReset, textInputRef]);

    const _onSend = useCallback(
      (message: Partial<IMessage>, shouldResetInputToolbar = false) => {
        flashListRef.current?.scrollToOffset({ offset: 0, animated: true });

        const newMessages: IMessage = {
          ...message,
          text: message.text ?? "",
          user,
          replyId: replyMessage?.id,
          reply: replyMessage ? { ...replyMessage } : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          id: messageIdGenerator(),
        };

        setReplyMessage(undefined);

        if (shouldResetInputToolbar) {
          resetInputToolbar();
        }

        if (onSend) {
          onSend(newMessages);
        }
      },
      [messageIdGenerator, onSend, replyMessage, resetInputToolbar, user],
    );

    const _onInputTextChanged = useCallback(
      (_text: string) => {
        if (onInputTextChanged) {
          onInputTextChanged(_text);
        }

        if (text === undefined) {
          setInputValue(_text);
        }
      },
      [onInputTextChanged, text],
    );

    const _renderInputToolbar = useCallback(() => {
      if (renderInputToolbar) {
        return renderInputToolbar({});
      }

      const handleResetReply = () => {
        setReplyMessage(undefined);
      };

      return (
        <View>
          {renderReplyContainer?.({
            replyMessage,
            onReset: handleResetReply,
            renderMessageImage,
            renderMessageAudio,
            renderMessageVideo,
            renderResetReplyIcon,
          }) ?? (
            <ReplyContainer
              replyMessage={replyMessage}
              onReset={handleResetReply}
              renderMessageImage={renderMessageImage}
              renderMessageAudio={renderMessageAudio}
              renderMessageVideo={renderMessageVideo}
              renderResetReplyIcon={renderResetReplyIcon}
            />
          )}
          <InputToolbar
            insets={insets}
            ref={textInputRef}
            renderActionButton={renderActionButton}
            renderInput={renderInput}
            renderSendButton={renderSend}
            onPressAttachButton={onPressAttachButton}
            inputProps={{
              maxInputHeight,
              disable,
              text: getTextFromProp(inputValue),
              onChangeText: _onInputTextChanged,
              placeholder,
              maxLength: maxInputLength,
              ...textInputProps,
            }}
            sendButtonProps={{
              text: getTextFromProp(inputValue),
              onSend: _onSend,
              alwaysShowSend,
              icon: renderSendButtonIcon,
            }}
            attachButtonProps={{
              onPressAttachButton,
              icon: renderActionButtonIcon,
            }}
            renderRecordVoice={renderRecordVoice}
          />
        </View>
      );
    }, [
      renderInputToolbar,
      renderReplyContainer,
      replyMessage,
      renderMessageImage,
      renderMessageAudio,
      renderMessageVideo,
      renderResetReplyIcon,
      insets,
      textInputRef,
      renderActionButton,
      renderInput,
      renderSend,
      onPressAttachButton,
      maxInputHeight,
      disable,
      getTextFromProp,
      inputValue,
      _onInputTextChanged,
      placeholder,
      maxInputLength,
      textInputProps,
      _onSend,
      alwaysShowSend,
      renderSendButtonIcon,
      renderActionButtonIcon,
      renderRecordVoice,
    ]);

    const _renderLoading = useCallback(() => {
      if (renderLoading) {
        return renderLoading();
      }

      return null;
    }, [renderLoading]);

    const _containerStyle = useMemo(
      () => [
        styles.container,
        {
          paddingLeft: insets?.left,
          paddingRight: insets?.right,
          backgroundColor: theme.background,
        },
        containerStyle,
      ],
      [containerStyle, insets?.left, insets?.right, theme.background],
    );

    const _listViewProps = useMemo(
      () => ({
        keyboardShouldPersistTaps: keyboardShouldPersistTaps,
        ...listViewProps,
      }),
      [keyboardShouldPersistTaps, listViewProps],
    );

    const handleReply = useCallback(
      (message: IMessage) => {
        setReplyMessage(message);
        onReply?.(message);
        textInputRef.current?.focus();
      },
      [onReply, textInputRef],
    );

    return (
      <KeyboardAvoidingView
        keyboardVerticalOffset={-(insets?.bottom ?? 0)}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={_containerStyle}>
          {loading ? (
            _renderLoading()
          ) : (
            <MessageContainer
              ref={flashListRef}
              user={user}
              messages={messages}
              extraData={extraData}
              inverted={inverted}
              loadEarlier={loadEarlier}
              scrollToBottom={scrollToBottom}
              scrollToBottomOffset={scrollToBottomOffset}
              infiniteScroll={infiniteScroll}
              isLoadingEarlier={isLoadingEarlier}
              listViewProps={_listViewProps}
              scrollToBottomStyle={scrollToBottomStyle}
              onLoadEarlier={onLoadEarlier}
              onViewableMessages={onViewableMessages}
              renderScrollToBottomIcon={renderScrollToBottomIcon}
              renderChatEmpty={renderChatEmpty}
              renderFooter={renderFooter}
              renderMessage={renderMessage}
              renderLoadEarlier={renderLoadEarlier}
              renderReplyIcon={renderReplyIcon}
              // MessageProps
              dateFormat={dateFormat}
              renderAvatarOnTop={renderAvatarOnTop}
              showAvatarForEveryMessage={showAvatarForEveryMessage}
              showUserAvatar={showUserAvatar}
              replyIconColor={replyIconColor}
              onPressAvatar={onPressAvatar}
              onLongPressAvatar={onLongPressAvatar}
              onReply={handleReply}
              renderBubble={renderBubble}
              renderDay={renderDay}
              renderSystemMessage={renderSystemMessage}
              renderAvatar={renderAvatar}
              // Bubble props
              showUsernameOnMessage={showUsernameOnMessage}
              parsePatterns={parsePatterns}
              imageProps={imageProps}
              imageStyle={imageStyle}
              timeFormat={timeFormat}
              timeTextStyle={timeTextStyle}
              onPress={onPress}
              onLongPress={onLongPress}
              renderMessageImage={renderMessageImage}
              renderMessageVideo={renderMessageVideo}
              renderMessageAudio={renderMessageAudio}
              renderMessageText={renderMessageText}
              renderTime={renderTime}
              renderTicks={renderTicks}
              renderUsername={renderUsername}
            />
          )}
          {_renderChatFooter()}
          {_renderInputToolbar()}
        </View>
      </KeyboardAvoidingView>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  replyResetIcon: { alignSelf: "flex-start", marginTop: 8, marginRight: 8 },
});

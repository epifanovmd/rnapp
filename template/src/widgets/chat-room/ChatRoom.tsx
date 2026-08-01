import { StackProps } from "@shared/lib/navigation";
import { useTheme } from "@shared/lib/theme";
import { Col, Navbar, Row, Switch, Text } from "@shared/ui";
// Тестовое исключение: демо-переключатель нативной и RN-реализаций —
// обычный код должен импортировать ChatView из @shared/ui.
import { JsChatView } from "@shared/ui/chat-view/JsChatView";
import { NativeChatView } from "@shared/ui/chat-view/native";
import { ImageViewing } from "@shared/ui/image-viewing";
import { observer } from "mobx-react-lite";
import React, { FC, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { AttachmentPickerSheet } from "./AttachmentPickerSheet";
import { mapMessageToNative } from "./native/map-message-to-native";
import { PollDetailModal } from "./PollDetailModal";
import { useChatRoomMock } from "./useChatRoomMock";

/** Инлайновые литералы в пропах ломают memo на ChatView — держим стабильными. */
const EMOJI_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

/**
 * Демо-экран нативного чата. Полностью на моках (см. useChatRoomMock) —
 * ни API, ни сокет не используются. Открывается как экран стека
 * (`Chat`) кнопкой со страницы Playground, без списка диалогов — задача
 * экрана только показать возможности нативного ChatView-компонента.
 */
export const ChatRoom: FC<StackProps> = observer(() => {
  const { isDark } = useTheme();

  const [useNative, setUseNative] = useState(Platform.OS === "ios");

  const Chat = useNative ? NativeChatView : JsChatView;

  const {
    chatDisplayName,
    typingText,
    isRefreshing,
    subtitle,
    messages,
    currentUserId,
    chatRef,
    inputAction,
    showAttachmentPicker,
    pollDetailId,
    imageViewerIndex,
    imageViewerImages,
    isGroupChat,
    isReturningToLatest,
    hasMore,
    hasNewer,
    unreadCount,
    setPollDetailId,
    setImageViewerIndex,
    getActionsForMessage,
    handleSendMessage,
    handleEditMessage,
    handleCancelInputAction,
    handleTyping,
    handleReachTop,
    handleReachBottom,
    handleVisibleMessagesChange,
    handleUnreadMessagesAppear,
    handleActionPress,
    handleEmojiReaction,
    handleReactionTap,
    handleReplyMessagePress,
    handlePollOptionPress,
    handlePollDetailPress,
    handleMessagePress,
    handleAttachmentPress,
    handleAttachmentPickerClose,
    handleCameraPress,
    handleGalleryPress,
    handleFilePickerPress,
    handleVoiceRecordingComplete,
    handleFabPress,
    handleScrollAnchorChanged,
  } = useChatRoomMock();

  const chatFeatures = useMemo(
    () => ({ disintegrationEnabled: true, showAvatars: isGroupChat }),
    [isGroupChat],
  );

  const nativeMessages = useMemo(
    () => messages.map(m => mapMessageToNative(m, currentUserId)),
    [messages, currentUserId],
  );

  return (
    <Col flex={1}>
      <Navbar title={chatDisplayName} safeArea>
        <Navbar.BackButton />
        <Navbar.Title />
        <Navbar.Subtitle>
          <View style={styles.subtitleContainer}>
            {isRefreshing ? (
              <Text textStyle={"Body_S1"} color={"blue600"}>
                {"обновление..."}
              </Text>
            ) : typingText ? (
              <Text textStyle={"Body_S1"} color={"blue600"}>
                {typingText}
              </Text>
            ) : (
              <Text textStyle={"Body_S1"} color={"blue600"}>
                {subtitle}
              </Text>
            )}
          </View>
        </Navbar.Subtitle>
      </Navbar>

      <Row
        ph={16}
        pv={6}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Col flexShrink={1} pr={12}>
          <Text textStyle={"Body_M1"}>
            {"Нативная реализация (RNChatView)"}
          </Text>
          <Text textStyle={"Caption_M2"} color={"textSecondary"}>
            {Platform.OS === "ios"
              ? useNative
                ? "Сейчас: нативная (iOS)"
                : "Сейчас: React Native (@legendapp/list)"
              : "На этой платформе доступна только React Native-реализация"}
          </Text>
        </Col>
        <Switch
          isActive={useNative}
          disabled={Platform.OS !== "ios"}
          onChange={setUseNative}
        />
      </Row>

      <Chat
        ref={chatRef}
        style={styles.chat}
        messages={nativeMessages}
        getActionsForMessage={getActionsForMessage}
        emojiReactions={EMOJI_REACTIONS}
        inputAction={inputAction}
        hasMore={hasMore}
        hasNewer={hasNewer}
        isLoading={false}
        isLoadingTop={false}
        isLoadingBottom={false}
        isLoadingFab={isReturningToLatest}
        theme={isDark ? "dark" : "light"}
        topThreshold={400}
        features={chatFeatures}
        showSenderName={false}
        bottomThreshold={400}
        scrollToBottomThreshold={150}
        collectionInsetTop={0}
        collectionInsetBottom={0}
        onSendMessage={handleSendMessage}
        onEditMessage={handleEditMessage}
        onCancelInputAction={handleCancelInputAction}
        onReachTop={handleReachTop}
        onReachBottom={handleReachBottom}
        onVisibleMessagesChange={handleVisibleMessagesChange}
        onUnreadMessagesAppear={handleUnreadMessagesAppear}
        onActionPress={handleActionPress}
        onEmojiReactionSelect={handleEmojiReaction}
        onReplyMessagePress={handleReplyMessagePress}
        onPollOptionPress={handlePollOptionPress}
        onPollDetailPress={handlePollDetailPress}
        onMessagePress={handleMessagePress}
        onAttachmentPress={handleAttachmentPress}
        onVoiceRecordingComplete={handleVoiceRecordingComplete}
        onInputTyping={handleTyping}
        onReactionTap={handleReactionTap}
        unreadCount={unreadCount}
        onFabPress={handleFabPress}
        onScrollAnchorChanged={handleScrollAnchorChanged}
      />

      <AttachmentPickerSheet
        visible={showAttachmentPicker}
        onClose={handleAttachmentPickerClose}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
        onFilePress={handleFilePickerPress}
      />

      <ImageViewing
        images={imageViewerImages}
        imageIndex={imageViewerIndex >= 0 ? imageViewerIndex : 0}
        visible={imageViewerIndex >= 0}
        onRequestClose={() => setImageViewerIndex(-1)}
      />

      {pollDetailId && (
        <PollDetailModal
          pollId={pollDetailId}
          messages={messages}
          onClose={() => setPollDetailId(null)}
        />
      )}
    </Col>
  );
});

const styles = StyleSheet.create({
  chat: {
    flex: 1,
  },
  subtitleContainer: {
    position: "absolute",
    bottom: 0,
    left: 60,
    right: 60,
    alignItems: "center",
  },
});

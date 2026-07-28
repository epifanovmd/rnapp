import { AppScreenProps } from "@shared/lib/navigation";
import { useTheme } from "@shared/lib/theme";
import { Col, Navbar, Text } from "@shared/ui";
import { ImageViewing } from "@shared/ui/image-viewing";
import { observer } from "mobx-react-lite";
import React, { FC, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AttachmentPickerSheet } from "./AttachmentPickerSheet";
import { ChatView } from "./native/ChatView";
import { mapMessageToNative } from "./native/map-message-to-native";
import { PollDetailModal } from "./PollDetailModal";
import { useChatRoomMock } from "./useChatRoomMock";

/**
 * Демо-экран нативного чата. Полностью на моках (см. useChatRoomMock) —
 * ни API, ни сокет не используются. Открывается напрямую из таб-бара
 * («Chats»), без списка диалогов — задача экрана только показать
 * возможности нативного ChatView-компонента.
 */
export const ChatRoom: FC<AppScreenProps> = observer(() => {
  const { isDark } = useTheme();

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

  const nativeMessages = useMemo(
    () => messages.map(m => mapMessageToNative(m, currentUserId)),
    [messages, currentUserId],
  );

  return (
    <Col flex={1}>
      <Navbar title={chatDisplayName} safeArea>
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

      <ChatView
        ref={chatRef}
        style={styles.chat}
        messages={nativeMessages}
        getActionsForMessage={getActionsForMessage}
        emojiReactions={["❤️", "👍", "😂", "😮", "😢", "🙏"]}
        inputAction={inputAction}
        hasMore={hasMore}
        hasNewer={hasNewer}
        isLoading={false}
        isLoadingTop={false}
        isLoadingBottom={false}
        isLoadingFab={isReturningToLatest}
        theme={isDark ? "dark" : "light"}
        topThreshold={400}
        features={{ disintegrationEnabled: true, showAvatars: isGroupChat }}
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

import { Col, Navbar, NavbarIcon, Text, useBottomSheetRef } from "@shared/ui";
import { ChatView } from "@shared/ui/chat-view";
import { ImageViewing } from "@shared/ui/image-viewing";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { AttachmentPickerSheet } from "./AttachmentPickerSheet";
import { ChatSettingsModal } from "./ChatSettingsModal";
import { PollDetailModal } from "./PollDetailModal";
import { useChatRoomMock } from "./useChatRoomMock";

/**
 * Демо-экран чата. Полностью на моках (см. useChatRoomMock) — ни API, ни
 * сокет не используются. Открывается как экран стека (`Chat`) кнопкой со
 * страницы Playground, без списка диалогов — задача экрана только показать
 * возможности компонента ChatView.
 */
export const ChatRoom: FC = observer(() => {
  const {
    chatDisplayName,
    typingText,
    isRefreshing,
    subtitle,
    messages,
    chatMessages,
    initialScrollAnchor,
    chatRef,
    isScrollRestoreEnabled,
    onScrollRestoreToggle,
    inputAction,
    showAttachmentPicker,
    pollDetailId,
    imageViewerIndex,
    imageViewerImages,
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
    handleScroll,
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
    handleThreadTap,
    handleLinkTap,
    handlePhoneNumberTap,
    handleAttachmentPress,
    handleAttachmentPickerClose,
    handleCameraPress,
    handleGalleryPress,
    handleFilePickerPress,
    handleVoiceRecordingComplete,
    handleFabPress,
    handleScrollAnchorChanged,
  } = useChatRoomMock();

  const settingsSheetRef = useBottomSheetRef();

  return (
    <Col flex={1}>
      <Navbar title={chatDisplayName} safeArea>
        <Navbar.BackButton />
        <Navbar.Title />
        <Navbar.Subtitle>
          <View style={styles.subtitleContainer}>
            {isRefreshing ? (
              <Text textStyle={"Body_S1"} color={"textLink"}>
                {"обновление..."}
              </Text>
            ) : typingText ? (
              <Text textStyle={"Body_S1"} color={"textLink"}>
                {typingText}
              </Text>
            ) : (
              <Text textStyle={"Body_S1"} color={"textLink"}>
                {subtitle}
              </Text>
            )}
          </View>
        </Navbar.Subtitle>
        <Navbar.Right>
          <TouchableOpacity
            onPress={() => settingsSheetRef.current?.present()}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <NavbarIcon name="settings" />
          </TouchableOpacity>
        </Navbar.Right>
      </Navbar>

      <ChatView
        ref={chatRef}
        style={styles.chat}
        messages={chatMessages}
        initialScrollAnchor={initialScrollAnchor}
        getActionsForMessage={getActionsForMessage}
        inputAction={inputAction}
        hasMore={hasMore}
        hasNewer={hasNewer}
        isLoading={false}
        isLoadingTop={false}
        isLoadingBottom={false}
        isLoadingFab={isReturningToLatest}
        onSendMessage={handleSendMessage}
        onEditMessage={handleEditMessage}
        onCancelInputAction={handleCancelInputAction}
        onScroll={handleScroll}
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
        onThreadTap={handleThreadTap}
        onLinkTap={handleLinkTap}
        onPhoneNumberTap={handlePhoneNumberTap}
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

      <ChatSettingsModal
        ref={settingsSheetRef}
        isScrollRestoreEnabled={isScrollRestoreEnabled}
        onScrollRestoreToggle={onScrollRestoreToggle}
      />
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

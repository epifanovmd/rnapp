import { StackProps } from "@shared/lib/navigation";
import { useTheme } from "@shared/lib/theme";
import {
  Col,
  Navbar,
  NavbarIcon,
  Row,
  Switch,
  Text,
  useBottomSheetRef,
} from "@shared/ui";
// Тестовое исключение: демо-переключатель нативной и RN-реализаций —
// обычный код должен импортировать ChatView из @shared/ui.
import { JsChatView } from "@shared/ui/chat-view/JsChatView";
import { NativeChatView } from "@shared/ui/chat-view/native";
import { ImageViewing } from "@shared/ui/image-viewing";
import { observer } from "mobx-react-lite";
import React, { FC, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";

import { AttachmentPickerSheet } from "./AttachmentPickerSheet";
import { ChatSettingsModal } from "./ChatSettingsModal";
import { PollDetailModal } from "./PollDetailModal";
import { useChatRoomMock } from "./useChatRoomMock";

/**
 * Демо-экран нативного чата. Полностью на моках (см. useChatRoomMock) —
 * ни API, ни сокет не используются. Открывается как экран стека
 * (`Chat`) кнопкой со страницы Playground, без списка диалогов — задача
 * экрана только показать возможности нативного ChatView-компонента.
 */
export const ChatRoom: FC<StackProps> = observer(() => {
  const { isDark } = useTheme();

  const [useNative, setUseNative] = useState(Platform.OS !== "ios");

  const Chat = useNative ? NativeChatView : JsChatView;

  const {
    chatDisplayName,
    typingText,
    isRefreshing,
    subtitle,
    messages,
    nativeMessages,
    initialScrollAnchor,
    chatRef,
    chatFeatures,
    updateFeature,
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
        <Navbar.Right>
          <TouchableOpacity
            onPress={() => settingsSheetRef.current?.present()}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <NavbarIcon name="settings" />
          </TouchableOpacity>
        </Navbar.Right>
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
        initialScrollAnchor={initialScrollAnchor}
        getActionsForMessage={getActionsForMessage}
        inputAction={inputAction}
        hasMore={hasMore}
        hasNewer={hasNewer}
        isLoading={false}
        isLoadingTop={false}
        isLoadingBottom={false}
        isLoadingFab={isReturningToLatest}
        theme={isDark ? "dark" : "light"}
        features={chatFeatures}
        collectionInsetTop={0}
        collectionInsetBottom={0}
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
        features={chatFeatures}
        onUpdate={updateFeature}
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

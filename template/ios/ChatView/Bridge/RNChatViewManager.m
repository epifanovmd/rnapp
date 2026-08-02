#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RNChatViewManager, RCTViewManager)

// MARK: - Props

RCT_EXPORT_VIEW_PROPERTY(messages, NSArray)
RCT_EXPORT_VIEW_PROPERTY(hasMore, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hasNewer, BOOL)
RCT_EXPORT_VIEW_PROPERTY(isLoading, BOOL)
RCT_EXPORT_VIEW_PROPERTY(emptyStateText, NSString)
RCT_EXPORT_VIEW_PROPERTY(isLoadingTop, BOOL)
RCT_EXPORT_VIEW_PROPERTY(isLoadingBottom, BOOL)
RCT_EXPORT_VIEW_PROPERTY(isLoadingFab, BOOL)
RCT_EXPORT_VIEW_PROPERTY(inputAction, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(initialScrollAnchor, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(theme, NSString)
RCT_EXPORT_VIEW_PROPERTY(collectionInsetTop, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(collectionInsetBottom, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(inputTypingThrottle, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(visibleMessagesThrottleInterval, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(unreadMessagesDebounceInterval, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(visibilityThreshold, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(unreadVisibilityThreshold, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(unreadCount, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(features, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(layout, NSDictionary)

// MARK: - Events

RCT_EXPORT_VIEW_PROPERTY(onScroll, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onReachTop, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onReachBottom, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onVisibleMessagesChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onUnreadMessagesAppear, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMessagePress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onActionPress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onEmojiReactionSelect, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onSendMessage, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onEditMessage, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onCancelInputAction, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onAttachmentPress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onReplyMessagePress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPollOptionPress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPollDetailPress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onVoiceRecordingComplete, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onInputTyping, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onReactionTap, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onThreadTap, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLinkTap, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPhoneNumberTap, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFabPress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onScrollAnchorChanged, RCTDirectEventBlock)

// MARK: - Commands

RCT_EXTERN_METHOD(scrollToBottom:(nonnull NSNumber *)node)
RCT_EXTERN_METHOD(scrollToMessage:(nonnull NSNumber *)node
                  messageId:(nonnull NSString *)messageId
                  position:(nonnull NSString *)position
                  animated:(BOOL)animated
                  highlight:(BOOL)highlight)
RCT_EXTERN_METHOD(clearUnread:(nonnull NSNumber *)node)

@end

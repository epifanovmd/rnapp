// MARK: - RNChatViewManager.m
// UPDATED: добавлены emojiReactions проп и onEmojiReactionSelect ивент.

#import <React/RCTViewManager.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNChatViewManager, RCTViewManager)

// Props
RCT_EXPORT_VIEW_PROPERTY(messages,                 NSArray)
RCT_EXPORT_VIEW_PROPERTY(actions,                  NSArray)
RCT_EXPORT_VIEW_PROPERTY(emojiReactions,           NSArray)
RCT_EXPORT_VIEW_PROPERTY(topThreshold,             NSNumber)
RCT_EXPORT_VIEW_PROPERTY(isLoading,                BOOL)
RCT_EXPORT_VIEW_PROPERTY(inputAction,              NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(initialScrollId,          NSString)
RCT_EXPORT_VIEW_PROPERTY(scrollToBottomThreshold,  NSNumber)
RCT_EXPORT_VIEW_PROPERTY(theme,                    NSString)
RCT_EXPORT_VIEW_PROPERTY(collectionInsetTop,       NSNumber)
RCT_EXPORT_VIEW_PROPERTY(collectionInsetBottom,    NSNumber)

// Events
RCT_EXPORT_VIEW_PROPERTY(onScroll,                 RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onReachTop,               RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMessagesVisible,        RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMessagePress,           RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onActionPress,            RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onEmojiReactionSelect,    RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onSendMessage,            RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onEditMessage,            RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onCancelInputAction,      RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onAttachmentPress,        RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onReplyMessagePress,      RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onVideoPress,             RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPollOptionPress,        RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPollDetailPress,        RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFilePress,              RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onVoiceRecordingComplete, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onReachBottom,            RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(hasMore,                  BOOL)
RCT_EXPORT_VIEW_PROPERTY(hasNewer,                 BOOL)
RCT_EXPORT_VIEW_PROPERTY(isLoadingBottom,          BOOL)
RCT_EXPORT_VIEW_PROPERTY(bottomThreshold,          NSNumber)

// Commands
RCT_EXTERN_METHOD(scrollToBottom:(nonnull NSNumber *)node)
RCT_EXTERN_METHOD(scrollToMessage:(nonnull NSNumber *)node
                  messageId:(NSString *)messageId
                  position:(NSString *)position
                  animated:(BOOL)animated
                  highlight:(BOOL)highlight)

@end

// RNChatViewManager.m
// Objective-C bridge declarations for React Native

#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>

@interface RCT_EXTERN_MODULE(RNChatViewManager, RCTViewManager)

// Props
RCT_EXPORT_VIEW_PROPERTY(messages, NSArray)
RCT_EXPORT_VIEW_PROPERTY(actions, NSArray)
RCT_EXPORT_VIEW_PROPERTY(topThreshold, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(isLoading, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(replyMessage, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(initialScrollId, NSString)
RCT_EXPORT_VIEW_PROPERTY(scrollToBottomThreshold, NSNumber)

// Events
RCT_EXPORT_VIEW_PROPERTY(onScroll, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onReachTop, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMessagesVisible, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMessagePress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onActionPress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onSendMessage, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onAttachmentPress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onReplyMessagePress, RCTDirectEventBlock)

// Commands
RCT_EXTERN_METHOD(scrollToBottom:(nonnull NSNumber *)node)

RCT_EXTERN_METHOD(
  scrollToMessage:(nonnull NSNumber *)node
  messageId:(NSString *)messageId
  position:(nullable NSString *)position
  animated:(BOOL)animated
  highlight:(BOOL)highlight
)

@end

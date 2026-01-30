 #import <React/RCTViewManager.h>
 #import <React/RCTBridgeModule.h>

 @interface RCT_EXTERN_MODULE(ChatViewManager, RCTViewManager)

 RCT_EXPORT_VIEW_PROPERTY(userId, NSInteger)
 RCT_EXPORT_VIEW_PROPERTY(configuration, NSDictionary)
 RCT_EXPORT_VIEW_PROPERTY(messages, NSArray)

 RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
 RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, NSString)
 RCT_EXPORT_VIEW_PROPERTY(keyboardScrollOffset, NSNumber)
 RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
 RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
 RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
 RCT_EXPORT_VIEW_PROPERTY(insets, NSDictionary)

 RCT_EXPORT_VIEW_PROPERTY(initialScrollId, NSString)
 RCT_EXPORT_VIEW_PROPERTY(initialScrollIndex, NSNumber)
 RCT_EXPORT_VIEW_PROPERTY(initialScrollOffset, NSNumber)

 RCT_EXPORT_VIEW_PROPERTY(onVisibleMessages, RCTDirectEventBlock)
 RCT_EXPORT_VIEW_PROPERTY(onLoadPreviousMessages, RCTDirectEventBlock)
 RCT_EXPORT_VIEW_PROPERTY(onForwardMessage, RCTDirectEventBlock)
 RCT_EXPORT_VIEW_PROPERTY(onFavoriteMessage, RCTDirectEventBlock)
 RCT_EXPORT_VIEW_PROPERTY(onReplyToMessage, RCTDirectEventBlock)
 RCT_EXPORT_VIEW_PROPERTY(onDeleteMessage, RCTDirectEventBlock)

 RCT_EXPORT_VIEW_PROPERTY(onScroll, RCTDirectEventBlock)
 RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, RCTDirectEventBlock)
 RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, RCTDirectEventBlock)
 RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, RCTDirectEventBlock)
 RCT_EXPORT_VIEW_PROPERTY(onScrollAnimationEnd, RCTDirectEventBlock)

 RCT_EXTERN_METHOD(setMessages:(nonnull NSNumber *)node messages:(NSArray *)messages)
 RCT_EXTERN_METHOD(appendMessages:(nonnull NSNumber *)node messages:(NSArray *)messages)
 RCT_EXTERN_METHOD(prependMessages:(nonnull NSNumber *)node messages:(NSArray *)messages)
 RCT_EXTERN_METHOD(deleteMessage:(nonnull NSNumber *)node messageId:(NSString *)messageId)
 RCT_EXTERN_METHOD(markMessagesAsRead:(nonnull NSNumber *)node messageIds:(NSArray<NSString *> *)messageIds)
 RCT_EXTERN_METHOD(markMessagesAsReceived:(nonnull NSNumber *)node messageIds:(NSArray<NSString *> *)messageIds)

 RCT_EXTERN_METHOD(scrollToBottom:(nonnull NSNumber *)node animated:(BOOL)animated)
 RCT_EXTERN_METHOD(scrollToMessage:(nonnull NSNumber *)node messageId:(NSString *)messageId animated:(BOOL)animated)
 RCT_EXTERN_METHOD(scrollToIndex:(nonnull NSNumber *)node index:(nonnull NSNumber *)index animated:(BOOL)animated)
 RCT_EXTERN_METHOD(scrollToOffset:(nonnull NSNumber *)node offset:(nonnull NSNumber *)offset animated:(BOOL)animated)

 @end

// MARK: - RNContextMenuViewManager.m
// ObjC-мост для регистрации RNContextMenuView в React Native.

#import <React/RCTViewManager.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNContextMenuViewManager, RCTViewManager)

// Props
RCT_EXPORT_VIEW_PROPERTY(emojis,               NSArray)
RCT_EXPORT_VIEW_PROPERTY(actions,              NSArray)
RCT_EXPORT_VIEW_PROPERTY(menuId,               NSString)
RCT_EXPORT_VIEW_PROPERTY(menuTheme,            NSString)
RCT_EXPORT_VIEW_PROPERTY(minimumPressDuration, NSNumber)

// Events
RCT_EXPORT_VIEW_PROPERTY(onEmojiSelect,  RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onActionSelect, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDismiss,      RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onWillShow,     RCTDirectEventBlock)

@end

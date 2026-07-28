#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RNInputBarManager, RCTViewManager)

// MARK: - Props

RCT_EXPORT_VIEW_PROPERTY(theme, NSString)
RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)

// MARK: - Input Action Props

RCT_EXPORT_VIEW_PROPERTY(inputAction, NSDictionary)

// MARK: - Events

RCT_EXPORT_VIEW_PROPERTY(onSendMessage, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onEditMessage, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onCancelInputAction, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onAttachmentPress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onVoiceRecordingStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onVoiceRecordingEnd, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onVoiceRecordingCancel, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onInputTyping, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onRecordingStateChange, RCTDirectEventBlock)

// MARK: - Commands

RCT_EXTERN_METHOD(clearInput:(nonnull NSNumber *)node)
RCT_EXTERN_METHOD(focus:(nonnull NSNumber *)node)
RCT_EXTERN_METHOD(blur:(nonnull NSNumber *)node)

@end

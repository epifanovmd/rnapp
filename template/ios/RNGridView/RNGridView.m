#import <React/RCTViewManager.h>
#import <React/RCTConvert.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTUIManager.h>

@interface RCT_EXTERN_MODULE(RNGridViewManager, RCTViewManager)

// MARK: - Props
RCT_EXPORT_VIEW_PROPERTY(items, NSArray)
RCT_EXPORT_VIEW_PROPERTY(endReachedThreshold, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(hasMoreData, BOOL)


RCT_EXPORT_VIEW_PROPERTY(itemHeight, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(verticalSpacing, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(horizontalInset, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(inverted, BOOL)
RCT_EXPORT_VIEW_PROPERTY(showsScrollIndicator, BOOL)
RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
RCT_EXPORT_VIEW_PROPERTY(initialScrollIndex, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(initialScrollId, NSString)
RCT_EXPORT_VIEW_PROPERTY(initialScrollOffset, NSNumber)


RCT_EXPORT_VIEW_PROPERTY(onEndReached, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onItemPress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onScroll, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, RCTDirectEventBlock)

// MARK: - Commands
RCT_EXTERN_METHOD(getScrollOffset:(nonnull NSNumber *)reactTag
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(scrollToIndex:(nonnull NSNumber *)reactTag
                  index:(nonnull NSNumber *)index
                  animated:(BOOL)animated)

RCT_EXTERN_METHOD(scrollToId:(nonnull NSNumber *)reactTag
                  id:(NSString *)id
                  animated:(BOOL)animated)

@end

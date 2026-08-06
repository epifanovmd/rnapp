#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RNWheelPickerManager, RCTViewManager)

// MARK: - Данные и поведение

RCT_EXPORT_VIEW_PROPERTY(items, NSArray)
RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(loop, BOOL)
RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(stopAtDisabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(haptics, BOOL)
RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSNumber)

// MARK: - Геометрия

RCT_EXPORT_VIEW_PROPERTY(itemHeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(visibleItemCount, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(itemSpacing, NSNumber)

// MARK: - Текст

RCT_EXPORT_VIEW_PROPERTY(itemColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(selectedItemColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(disabledItemColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(fontSize, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(selectedFontSize, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(fontFamily, NSString)
RCT_EXPORT_VIEW_PROPERTY(fontWeight, NSString)
RCT_EXPORT_VIEW_PROPERTY(selectedFontWeight, NSString)
RCT_EXPORT_VIEW_PROPERTY(textAlign, NSString)
RCT_EXPORT_VIEW_PROPERTY(numberOfLines, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(itemPaddingHorizontal, NSNumber)

// MARK: - Объём

RCT_EXPORT_VIEW_PROPERTY(curvature, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(edgeOpacity, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(edgeScale, NSNumber)

// MARK: - Индикатор и шторка

RCT_EXPORT_VIEW_PROPERTY(indicatorVisible, BOOL)
RCT_EXPORT_VIEW_PROPERTY(indicatorColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(indicatorSize, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, NSString)
RCT_EXPORT_VIEW_PROPERTY(indicatorRadius, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(indicatorInset, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(curtainVisible, BOOL)
RCT_EXPORT_VIEW_PROPERTY(curtainColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(curtainRadius, NSNumber)

// MARK: - События

RCT_EXPORT_VIEW_PROPERTY(onValueChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onScrollStateChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onScroll, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onItemPress, RCTDirectEventBlock)

// MARK: - Команды

RCT_EXTERN_METHOD(scrollToIndex:(nonnull NSNumber *)node
                  index:(nonnull NSNumber *)index
                  animated:(BOOL)animated)

@end

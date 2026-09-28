#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(AppSplash, AppSplashModule, NSObject)

RCT_EXTERN_METHOD(hide:(BOOL)fade
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isVisible:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end

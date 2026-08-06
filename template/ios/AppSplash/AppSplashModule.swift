import React

@objc(AppSplashModule)
final class AppSplashModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func hide(
    _ fade: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject _: @escaping RCTPromiseRejectBlock,
  ) {
    AppSplash.hide(fade: fade) { resolve(nil) }
  }

  @objc func isVisible(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject _: @escaping RCTPromiseRejectBlock,
  ) {
    DispatchQueue.main.async { resolve(AppSplash.isVisible) }
  }
}

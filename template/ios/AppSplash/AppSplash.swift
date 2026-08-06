import React
import UIKit

/**
 Splash-экран приложения.

 Launch screen iOS исчезает сразу после старта процесса, поэтому его сториборд
 инстанцируется ещё раз и отдаётся RN как `loadingView`: RN держит его поверх
 surface и не рисует свой фон, пока splash не убрали вызовом `hide()` из JS.
 */
@objc(AppSplash)
public final class AppSplash: NSObject {

  /// Имя цвета в `Colors.xcassets`; совпадает с `ios.names.background` конфига.
  private static let backgroundColorName = "SplashBackground"

  private static let fadeDuration: TimeInterval = 0.25

  /// Пауза, за которую системный launch screen успевает раствориться.
  private static let launchScreenDelay: TimeInterval = 0.35

  private static var splashView: UIView?
  private static weak var hostRootView: UIView?
  private static var isLaunchScreenGone = false
  private static var pendingHide: (fade: Bool, completion: () -> Void)?

  @objc public static var isVisible: Bool { splashView != nil }

  /// Фон splash: им красится root view, чтобы между системным launch screen и
  /// первым кадром RN не мелькал `systemBackgroundColor`.
  @objc public static var backgroundColor: UIColor? {
    UIColor(named: backgroundColorName)
  }

  /**
   Вызывается из `customize(_:)` — RN уже создал root view, но окно ещё не
   показано, поэтому splash попадает в самый первый кадр.
   */
  @objc public static func attach(storyboard name: String, to rootView: UIView) {
    guard !RCTRunningInAppExtension(), splashView == nil else {
      return
    }

    guard let view = UIStoryboard(name: name, bundle: nil)
      .instantiateInitialViewController()?.view
    else {
      return
    }

    view.frame = rootView.bounds
    view.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    // Каст через AnyObject: статический тип хука — legacy RCTRootView, а
    // фактически на New Architecture приходит surface-hosting root view.
    if let hosting = rootView as AnyObject as? RCTSurfaceHostingProxyRootView {
      // Иначе RN уберёт splash сам, как только смонтируется surface.
      hosting.disableActivityIndicatorAutoHide(true)
      hosting.loadingView = view
    } else {
      rootView.addSubview(view)
    }

    splashView = view
    hostRootView = rootView

    Timer.scheduledTimer(withTimeInterval: launchScreenDelay, repeats: false) { _ in
      isLaunchScreenGone = true

      // hide() позвали раньше, чем растворился системный launch screen.
      if let pending = pendingHide {
        pendingHide = nil
        hide(fade: pending.fade, completion: pending.completion)
      }
    }
  }

  @objc public static func hide(fade: Bool, completion: @escaping () -> Void) {
    guard Thread.isMainThread else {
      DispatchQueue.main.async { hide(fade: fade, completion: completion) }

      return
    }

    guard isLaunchScreenGone else {
      pendingHide = (fade, completion)

      return
    }

    guard let view = splashView else {
      completion()

      return
    }

    guard fade else {
      detach(view)
      completion()

      return
    }

    UIView.animate(
      withDuration: fadeDuration,
      delay: 0,
      options: [.curveEaseOut],
      animations: { view.alpha = 0 },
      completion: { _ in
        detach(view)
        completion()
      },
    )
  }

  /// RN держит ссылку в `loadingView`, но она non-optional — вью просто
  /// снимается с иерархии, как это делает и сама библиотека.
  private static func detach(_ view: UIView) {
    view.isHidden = true
    view.removeFromSuperview()
    splashView = nil
    hostRootView = nil
  }
}

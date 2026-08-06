import React
import UIKit

/**
 Splash-экран приложения.

 Launch screen iOS исчезает сразу после старта процесса, поэтому его сториборд
 инстанцируется ещё раз и кладётся поверх RN-контента — так картинка держится до
 вызова `hide()` из JS.
 */
@objc(AppSplash)
public final class AppSplash: NSObject {

  private static let fadeDuration: TimeInterval = 0.25

  /// Пауза, за которую системный launch screen успевает раствориться.
  private static let launchScreenDelay: TimeInterval = 0.35

  private static var splashView: UIView?
  private static var isLaunchScreenGone = false
  private static var pendingHide: (fade: Bool, completion: () -> Void)?

  @objc public static var isVisible: Bool { splashView != nil }

  /**
   Вызывается из `AppDelegate` сразу после старта RN.

   Оверлей вешается на окно, а не на RN root view: тот пересобирает свои
   сабвью при монтировании surface и перекрыл бы splash своим контентом.
   */
  @objc public static func show(storyboard name: String, over window: UIWindow) {
    guard !RCTRunningInAppExtension(), splashView == nil else {
      return
    }

    guard let view = UIStoryboard(name: name, bundle: nil)
      .instantiateInitialViewController()?.view
    else {
      return
    }

    // Констрейнты, а не frame: на момент вызова bounds окна ещё может быть пустым.
    view.translatesAutoresizingMaskIntoConstraints = false
    window.addSubview(view)

    NSLayoutConstraint.activate([
      view.topAnchor.constraint(equalTo: window.topAnchor),
      view.bottomAnchor.constraint(equalTo: window.bottomAnchor),
      view.leadingAnchor.constraint(equalTo: window.leadingAnchor),
      view.trailingAnchor.constraint(equalTo: window.trailingAnchor),
    ])

    splashView = view

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

    splashView = nil

    guard fade else {
      view.removeFromSuperview()
      completion()

      return
    }

    UIView.animate(
      withDuration: fadeDuration,
      delay: 0,
      options: [.curveEaseOut],
      animations: { view.alpha = 0 },
      completion: { _ in
        view.removeFromSuperview()
        completion()
      },
    )
  }
}

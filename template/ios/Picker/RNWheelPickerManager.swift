import React

@objc(RNWheelPickerManager)
final class RNWheelPickerManager: RCTViewManager {

  override func view() -> UIView! {
    RNWheelPickerView()
  }

  override static func requiresMainQueueSetup() -> Bool { true }

  @objc func scrollToIndex(_ node: NSNumber, index: NSNumber, animated: Bool) {
    DispatchQueue.main.async { [weak self] in
      guard let view = self?.bridge.uiManager.view(forReactTag: node) as? RNWheelPickerView else { return }
      view.scrollToIndex(index.intValue, animated: animated)
    }
  }
}

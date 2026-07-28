import React

@objc(RNInputBarManager)
final class RNInputBarManager: RCTViewManager {

    override func view() -> UIView! {
        RNInputBar()
    }

    override static func requiresMainQueueSetup() -> Bool { true }

    // MARK: - Commands

    @objc func clearInput(_ node: NSNumber) {
        DispatchQueue.main.async { [weak self] in
            guard let view = self?.bridge.uiManager.view(forReactTag: node) as? RNInputBar else { return }
            view.clearInput()
        }
    }

    @objc func focus(_ node: NSNumber) {
        DispatchQueue.main.async { [weak self] in
            guard let view = self?.bridge.uiManager.view(forReactTag: node) as? RNInputBar else { return }
            view.focus()
        }
    }

    @objc func blur(_ node: NSNumber) {
        DispatchQueue.main.async { [weak self] in
            guard let view = self?.bridge.uiManager.view(forReactTag: node) as? RNInputBar else { return }
            view.blur()
        }
    }
}

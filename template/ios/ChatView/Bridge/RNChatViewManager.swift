import React

@objc(RNChatViewManager)
final class RNChatViewManager: RCTViewManager {

    override func view() -> UIView! {
        RNChatView()
    }

    override static func requiresMainQueueSetup() -> Bool { true }

    // MARK: - Commands

    @objc func scrollToBottom(_ node: NSNumber) {
        DispatchQueue.main.async { [weak self] in
            guard let view = self?.bridge.uiManager.view(forReactTag: node) as? RNChatView else { return }
            view.scrollToBottom()
        }
    }

    @objc func scrollToMessage(_ node: NSNumber,
                                messageId: NSString,
                                position: NSString,
                                animated: Bool,
                                highlight: Bool) {
        DispatchQueue.main.async { [weak self] in
            guard let view = self?.bridge.uiManager.view(forReactTag: node) as? RNChatView else { return }
            view.scrollToMessage(
                messageId: messageId as String,
                position: position as String,
                animated: animated,
                highlight: highlight
            )
        }
    }
}

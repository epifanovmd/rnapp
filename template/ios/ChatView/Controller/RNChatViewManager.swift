// MARK: - RNChatViewManager.swift
// View Manager для Old Architecture и New Architecture (Fabric).

import Foundation
import React

@objc(RNChatViewManager)
final class RNChatViewManager: RCTViewManager {

    override static func requiresMainQueueSetup() -> Bool { true }

    override func view() -> UIView! { RNChatView() }

    // MARK: - Commands

    /// Прокручивает к последнему сообщению.
    @objc func scrollToBottom(_ node: NSNumber) {
        DispatchQueue.main.async {
            guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatView
            else { return }
            view.scrollToBottom()
        }
    }

    /// Прокручивает к сообщению по id с опциями позиции, анимации и подсветки.
    @objc func scrollToMessage(
        _ node: NSNumber,
        messageId: String,
        position: String?,
        animated: Bool,
        highlight: Bool
    ) {
        DispatchQueue.main.async {
            guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatView
            else { return }
            view.scrollToMessage(
                id: messageId, position: position,
                animated: animated, highlight: highlight)
        }
    }
}

// MARK: - RNChatViewManager.swift
// View Manager supporting both Old and New Architecture

import Foundation
import React

@objc(RNChatViewManager)
final class RNChatViewManager: RCTViewManager {

    override static func requiresMainQueueSetup() -> Bool { true }

    override func view() -> UIView! {
        return RNChatView()
    }

    // MARK: - Commands

    @objc func scrollToBottom(_ node: NSNumber) {
        DispatchQueue.main.async {
            guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatView else { return }
            view.scrollToBottom()
        }
    }

    /// Dispatched from JS via `Commands.scrollToMessage(ref, id, position, animated, highlight)`.
    @objc func scrollToMessage(
        _ node: NSNumber,
        messageId: String,
        position: String?,
        animated: Bool,
        highlight: Bool
    ) {
        DispatchQueue.main.async {
            guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatView else { return }
            view.scrollToMessage(id: messageId, position: position, animated: animated, highlight: highlight)
        }
    }
}

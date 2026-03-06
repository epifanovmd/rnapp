// MARK: - RNContextMenuViewManager.swift

import Foundation
import React

@objc(RNContextMenuViewManager)
final class RNContextMenuViewManager: RCTViewManager {

    override static func requiresMainQueueSetup() -> Bool { true }

    override func view() -> UIView! { RNContextMenuView() }
}

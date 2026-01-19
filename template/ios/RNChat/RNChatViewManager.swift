//
//  RNChatViewManager.swift
//  rnapp
//
//  Created by Andrei on 17.01.2026.
//

import Foundation
import React

@objc(ChatViewManager)
class ChatViewManager: RCTViewManager {
    
    override func view() -> UIView! {
        return RNChatContainer()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}

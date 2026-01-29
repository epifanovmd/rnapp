 //
 // RNChatViewManager.swift
 // chat-ios
 //
 // Created by Andrei on 17.01.2026.
 //

 import Foundation
 import React

 @objc(ChatViewManager)
 final class ChatViewManager: RCTViewManager {
     override func view() -> UIView! {
         RNChatContainer()
     }

     override static func requiresMainQueueSetup() -> Bool {
         true
     }
 }

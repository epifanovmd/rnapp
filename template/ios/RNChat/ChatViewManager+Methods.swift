 //
 // ChatViewManager+Methods.swift
 // chat-ios
 //
 // Created by Andrei on 17.01.2026.
 //

 import Foundation
 import React

 extension ChatViewManager {
     @objc func setMessages(_ node: NSNumber, messages: NSArray) {
         DispatchQueue.main.async {
             guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else {
                 return
             }
             let parsed = (messages as? [Any])?.compactMap { RNChatParsing.rawMessage(from: $0) } ?? []
             view.hostViewController.setMessages(parsed, animated: false)
         }
     }

     @objc func appendMessages(_ node: NSNumber, messages: NSArray) {
         DispatchQueue.main.async {
             guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else {
                 return
             }
             let parsed = (messages as? [Any])?.compactMap { RNChatParsing.rawMessage(from: $0) } ?? []
             view.hostViewController.appendMessages(parsed, animated: true)
         }
     }

     @objc func prependMessages(_ node: NSNumber, messages: NSArray) {
         DispatchQueue.main.async {
             guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else {
                 return
             }
             let parsed = (messages as? [Any])?.compactMap { RNChatParsing.rawMessage(from: $0) } ?? []
             view.hostViewController.prependMessages(parsed, animated: false)
         }
     }

     @objc func deleteMessage(_ node: NSNumber, messageId: String) {
         DispatchQueue.main.async {
             guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else {
                 return
             }
             guard let id = UUID(uuidString: messageId) else { return }
             view.hostViewController.deleteMessage(id: id)
         }
     }

     @objc func markMessagesAsRead(_ node: NSNumber, messageIds: [String]) {
         DispatchQueue.main.async {
             guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else {
                 return
             }
             let ids = messageIds.compactMap { UUID(uuidString: $0) }
             view.hostViewController.markMessagesAsRead(ids)
         }
     }

     @objc func markMessagesAsReceived(_ node: NSNumber, messageIds: [String]) {
         DispatchQueue.main.async {
             guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else {
                 return
             }
             let ids = messageIds.compactMap { UUID(uuidString: $0) }
             view.hostViewController.markMessagesAsReceived(ids)
         }
     }


     @objc func scrollToBottom(_ node: NSNumber, animated: Bool) {
         DispatchQueue.main.async {
             guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else { return }
             view.hostViewController.chatViewController.scrollToBottom(animated: animated)
         }
     }

     @objc func scrollToMessage(_ node: NSNumber, messageId: String, animated: Bool) {
         DispatchQueue.main.async {
             guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer,
                   let id = UUID(uuidString: messageId) else { return }
             view.hostViewController.chatViewController.scrollTo(messageId: id, animated: animated)
         }
     }

     @objc func scrollToIndex(_ node: NSNumber, index: NSNumber, animated: Bool) {
         DispatchQueue.main.async {
             guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else { return }
             view.hostViewController.chatViewController.scrollTo(index: index.intValue, animated: animated)
         }
     }

     @objc func scrollToOffset(_ node: NSNumber, offset: NSNumber, animated: Bool) {
         DispatchQueue.main.async {
             guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else { return }
             view.hostViewController.chatViewController.scrollTo(offset: CGFloat(offset.doubleValue), animated: animated)
         }
     }
 }

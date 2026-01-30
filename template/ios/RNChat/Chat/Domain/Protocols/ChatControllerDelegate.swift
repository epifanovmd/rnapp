//
// ChatLayout
// ChatControllerDelegate.swift
// https://github.com/ekazaev/ChatLayout
//
// Created by Eugene Kazaev in 2020-2026.
// Distributed under the MIT license.
//
// Become a sponsor:
// https://github.com/sponsors/ekazaev
//

import Foundation

protocol ChatControllerDelegate: AnyObject {
  func onVisibleMessages(_ messageIds: [UUID])
  func onLoadPreviousMessages(completion: @escaping () -> Void)
  func onForwardMessage(messageId: UUID)
  func onFavoriteMessage(messageId: UUID)
  func onReplyToMessage(messageId: UUID)
  func onDeleteMessage(messageId: UUID)
  func onScrollMessages(offset: CGPoint, contentSize: CGSize)
  
  func onScrollMessagesBeginDrag()
  func onScrollMessagesEndDrag()
  func onMomentumScrollMessagesEnd()
  func onScrollMessagesAnimationEnd()
}

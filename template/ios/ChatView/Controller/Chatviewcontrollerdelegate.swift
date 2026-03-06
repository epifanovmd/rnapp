// MARK: - ChatViewControllerDelegate.swift
// Протокол делегата ChatViewController.
// UPDATED: добавлен didSelectEmojiReaction для кастомного контекстного меню.

import UIKit

// MARK: - ChatScrollPosition

/// Позиция прокрутки при переходе к конкретному сообщению.
enum ChatScrollPosition {
    case top, center, bottom

    var collectionViewPosition: UICollectionView.ScrollPosition {
        switch self {
        case .top:    return .top
        case .center: return .centeredVertically
        case .bottom: return .bottom
        }
    }
}

// MARK: - ChatViewControllerDelegate

protocol ChatViewControllerDelegate: AnyObject {

    // MARK: Scroll
    func chatViewController(_ vc: ChatViewController, didScrollToOffset offset: CGPoint)
    func chatViewController(_ vc: ChatViewController, didReachTopThreshold threshold: CGFloat)

    // MARK: Visibility
    func chatViewController(_ vc: ChatViewController, messagesDidAppear messageIDs: [String])

    // MARK: Message interaction
    func chatViewController(_ vc: ChatViewController, didTapMessage message: ChatMessage)

    /// Выбрано действие из кастомного контекстного меню.
    func chatViewController(_ vc: ChatViewController, didSelectAction action: MessageAction, for message: ChatMessage)

    /// Выбрана emoji-реакция из кастомного контекстного меню.
    func chatViewController(_ vc: ChatViewController, didSelectEmojiReaction emoji: String, for message: ChatMessage)

    // MARK: Input bar
    func chatViewController(_ vc: ChatViewController, didSendMessage text: String, replyToId: String?)
    func chatViewController(_ vc: ChatViewController, didEditMessage text: String, messageId: String)
    func chatViewController(_ vc: ChatViewController, didCancelReply vc2: ChatViewController)
    func chatViewController(_ vc: ChatViewController, didCancelEdit vc2: ChatViewController)
    func chatViewControllerDidTapAttachment(_ vc: ChatViewController)

    // MARK: Reply navigation
    func chatViewController(_ vc: ChatViewController, didTapReply replyId: String)
}

/// Необязательные методы с пустой реализацией по умолчанию.
extension ChatViewControllerDelegate {
    func chatViewController(_ vc: ChatViewController, didEditMessage text: String, messageId: String) {}
    func chatViewController(_ vc: ChatViewController, didCancelReply vc2: ChatViewController) {}
    func chatViewController(_ vc: ChatViewController, didCancelEdit vc2: ChatViewController) {}
    func chatViewController(_ vc: ChatViewController, didSelectEmojiReaction emoji: String, for message: ChatMessage) {}
}

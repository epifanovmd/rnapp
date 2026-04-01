// MARK: - ChatViewControllerDelegate.swift

import UIKit

// MARK: - ChatScrollPosition

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
    func chatViewController(_ vc: ChatViewController, didReachBottomThreshold distance: CGFloat)

    // MARK: Visibility
    func chatViewController(_ vc: ChatViewController, messagesDidAppear messageIDs: [String])

    // MARK: Message interaction
    func chatViewController(_ vc: ChatViewController, didTapMessage message: ChatMessage)
    func chatViewController(_ vc: ChatViewController, didSelectAction action: MessageAction, for message: ChatMessage)
    func chatViewController(_ vc: ChatViewController, didSelectEmojiReaction emoji: String, for message: ChatMessage)

    // MARK: Media interaction
    func chatViewController(_ vc: ChatViewController, didTapVideo videoUrl: String, for message: ChatMessage)
    func chatViewController(_ vc: ChatViewController, didTapPollOption optionId: String, pollId: String, for message: ChatMessage)
    func chatViewController(_ vc: ChatViewController, didTapFile fileUrl: String, fileName: String, for message: ChatMessage)

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
    func chatViewController(_ vc: ChatViewController, didReachBottomThreshold distance: CGFloat) {}
    func chatViewController(_ vc: ChatViewController, didTapVideo videoUrl: String, for message: ChatMessage) {}
    func chatViewController(_ vc: ChatViewController, didTapPollOption optionId: String, pollId: String, for message: ChatMessage) {}
    func chatViewController(_ vc: ChatViewController, didTapFile fileUrl: String, fileName: String, for message: ChatMessage) {}
}

import UIKit

// MARK: - ChatViewControllerDelegate

protocol ChatViewControllerDelegate: AnyObject {
    func chatViewController(_ vc: ChatViewController, didScrollToOffset offset: CGPoint)
    func chatViewController(_ vc: ChatViewController, didReachTopThreshold threshold: CGFloat)
    func chatViewController(_ vc: ChatViewController, messagesDidAppear messageIDs: [String])
    func chatViewController(_ vc: ChatViewController, didTapMessage message: ChatMessage)
    func chatViewController(_ vc: ChatViewController, didSelectAction action: MessageAction, for message: ChatMessage)
    func chatViewController(_ vc: ChatViewController, didSendMessage text: String, replyToId: String?)
    func chatViewController(_ vc: ChatViewController, didEditMessage text: String, messageId: String)
    func chatViewController(_ vc: ChatViewController, didCancelReply vc2: ChatViewController)
    func chatViewController(_ vc: ChatViewController, didCancelEdit vc2: ChatViewController)
    func chatViewController(_ vc: ChatViewController, didTapReply replyId: String)
    func chatViewControllerDidTapAttachment(_ vc: ChatViewController)
}

extension ChatViewControllerDelegate {
    func chatViewController(_ vc: ChatViewController, didEditMessage text: String, messageId: String) {}
    func chatViewController(_ vc: ChatViewController, didCancelReply vc2: ChatViewController) {}
    func chatViewController(_ vc: ChatViewController, didCancelEdit vc2: ChatViewController) {}
}

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

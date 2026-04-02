import UIKit

protocol ChatViewControllerDelegate: AnyObject {
    // MARK: - Scroll Events
    func chatDidScroll(offset: CGPoint)
    func chatDidReachTop(distance: CGFloat)
    func chatDidReachBottom(distance: CGFloat)

    // MARK: - Visibility
    func chatMessagesDidAppear(ids: [String])

    // MARK: - Message Interactions
    func chatDidTapMessage(id: String)
    func chatDidSelectAction(actionId: String, messageId: String)
    func chatDidSelectEmojiReaction(emoji: String, messageId: String)
    func chatDidTapReplyMessage(id: String)

    // MARK: - Media
    func chatDidTapVideo(messageId: String, url: String)
    func chatDidTapFile(messageId: String, url: String, name: String)
    func chatDidTapPollOption(messageId: String, pollId: String, optionId: String)
    func chatDidTapPollDetail(messageId: String, pollId: String)

    // MARK: - Input
    func chatDidSendMessage(text: String, replyToId: String?)
    func chatDidEditMessage(text: String, messageId: String)
    func chatDidCancelInputAction(type: String)
    func chatDidTapAttachment()
    func chatDidCompleteVoiceRecording(fileURL: URL, duration: TimeInterval)
    func chatDidChangeInputText(_ text: String)
}

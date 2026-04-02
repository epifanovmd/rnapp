import UIKit
import React

final class RNChatView: UIView {

    // MARK: - Event Handlers

    @objc var onScroll: RCTDirectEventBlock?
    @objc var onReachTop: RCTDirectEventBlock?
    @objc var onReachBottom: RCTDirectEventBlock?
    @objc var onMessagesVisible: RCTDirectEventBlock?
    @objc var onMessagePress: RCTDirectEventBlock?
    @objc var onActionPress: RCTDirectEventBlock?
    @objc var onEmojiReactionSelect: RCTDirectEventBlock?
    @objc var onSendMessage: RCTDirectEventBlock?
    @objc var onEditMessage: RCTDirectEventBlock?
    @objc var onCancelInputAction: RCTDirectEventBlock?
    @objc var onAttachmentPress: RCTDirectEventBlock?
    @objc var onReplyMessagePress: RCTDirectEventBlock?
    @objc var onPollOptionPress: RCTDirectEventBlock?
    @objc var onPollDetailPress: RCTDirectEventBlock?
    @objc var onVoiceRecordingComplete: RCTDirectEventBlock?
    @objc var onInputTyping: RCTDirectEventBlock?
    @objc var onReactionTap: RCTDirectEventBlock?

    // MARK: - Props

    @objc var messages: NSArray = [] {
        didSet { applyMessages() }
    }

    @objc var emojiReactions: NSArray = [] {
        didSet { chatVC.emojiReactionsList = emojiReactions.compactMap { $0 as? String } }
    }

    @objc var hasMore: Bool = false {
        didSet { chatVC.hasMore = hasMore }
    }

    @objc var hasNewer: Bool = false {
        didSet { chatVC.hasNewer = hasNewer }
    }

    @objc var topThreshold: NSNumber = 200 {
        didSet { chatVC.topThreshold = CGFloat(topThreshold.doubleValue) }
    }

    @objc var bottomThreshold: NSNumber = 200 {
        didSet { chatVC.bottomThreshold = CGFloat(bottomThreshold.doubleValue) }
    }

    @objc var isLoading: Bool = false {
        didSet { chatVC.isLoading = isLoading }
    }

    @objc var isLoadingTop: Bool = false {
        didSet { chatVC.isLoadingTop = isLoadingTop }
    }

    @objc var isLoadingBottom: Bool = false {
        didSet { chatVC.isLoadingBottom = isLoadingBottom }
    }

    @objc var inputAction: NSDictionary? {
        didSet { applyInputAction() }
    }

    @objc var initialScrollId: NSString? {
        didSet {
            if let id = initialScrollId as? String, !id.isEmpty {
                chatVC.isInitialScrollProtected = true
                chatVC.pendingScrollMessageId = id
            }
        }
    }

    @objc var scrollToBottomThreshold: NSNumber = 150 {
        didSet { chatVC.scrollToBottomThreshold = CGFloat(scrollToBottomThreshold.doubleValue) }
    }

    @objc var theme: NSString = "light" {
        didSet { chatVC.theme = (theme == "dark") ? .dark : .light }
    }

    @objc var showSenderName: Bool = false {
        didSet { chatVC.showsSenderName = showSenderName }
    }

    @objc var showFloatingDate: Bool = true {
        didSet { chatVC.showsFloatingDate = showFloatingDate }
    }

    @objc var collectionInsetTop: NSNumber = 0 {
        didSet { chatVC.collectionExtraInsetTop = CGFloat(collectionInsetTop.doubleValue) }
    }

    @objc var collectionInsetBottom: NSNumber = 0 {
        didSet { chatVC.collectionExtraInsetBottom = CGFloat(collectionInsetBottom.doubleValue) }
    }

    @objc var inputTypingThrottle: NSNumber = 500

    // MARK: - Internal

    private let chatVC = ChatViewController()
    private var isSetup = false
    private var lastTypingTime: CFTimeInterval = 0

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        guard !isSetup else { return }
        isSetup = true

        chatVC.delegate = self
        chatVC.view.translatesAutoresizingMaskIntoConstraints = false
        addSubview(chatVC.view)

        NSLayoutConstraint.activate([
            chatVC.view.topAnchor.constraint(equalTo: topAnchor),
            chatVC.view.leadingAnchor.constraint(equalTo: leadingAnchor),
            chatVC.view.trailingAnchor.constraint(equalTo: trailingAnchor),
            chatVC.view.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
    }

    private var parentViewController: UIViewController? {
        var responder: UIResponder? = self
        while let next = responder?.next {
            if let vc = next as? UIViewController { return vc }
            responder = next
        }
        return nil
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        if let window {
            // Добавляем chatVC как child для корректного проброса safe area
            if chatVC.parent == nil, let parentVC = parentViewController {
                parentVC.addChild(chatVC)
                chatVC.didMove(toParent: parentVC)
            }
        } else {
            VoicePlayer.shared.stop()
        }
    }

    // MARK: - Commands

    func scrollToBottom() {
        chatVC.scrollToBottom(animated: true)
    }

    func scrollToMessage(messageId: String, position: String, animated: Bool, highlight: Bool) {
        chatVC.scrollToMessage(id: messageId, position: position, animated: animated, highlight: highlight)
    }

    // MARK: - Private

    private func applyMessages() {
        let parsed = messages.compactMap { ($0 as? NSDictionary).flatMap(ChatMessage.from) }
            .sorted { $0.timestamp < $1.timestamp }
        chatVC.updateMessages(parsed)
    }

    private func applyInputAction() {
        guard let dict = inputAction else {
            chatVC.clearInputMode()
            return
        }
        let type = dict["type"] as? String ?? "none"
        let messageId = dict["messageId"] as? String

        switch type {
        case "reply":
            guard let id = messageId, let msg = chatVC.message(forID: id) else { return }
            let info = ReplyInfo(
                replyToId: id,
                senderName: msg.senderName,
                text: msg.content.text,
                hasImage: msg.content.media != nil
            )
            chatVC.beginReply(info: info)
        case "edit":
            guard let id = messageId, let msg = chatVC.message(forID: id) else { return }
            chatVC.beginEdit(messageId: id, text: msg.content.text ?? "")
        default:
            chatVC.clearInputMode()
        }
    }
}

// MARK: - ChatViewControllerDelegate

extension RNChatView: ChatViewControllerDelegate {
    func chatDidScroll(offset: CGPoint) {
        onScroll?(["x": offset.x, "y": offset.y])
    }

    func chatDidReachTop(distance: CGFloat) {
        onReachTop?(["distanceFromTop": distance])
    }

    func chatDidReachBottom(distance: CGFloat) {
        onReachBottom?(["distanceFromBottom": distance])
    }

    func chatMessagesDidAppear(ids: [String]) {
        onMessagesVisible?(["messageIds": ids])
    }

    func chatDidTapMessage(id: String, attachmentIndex: Int?) {
        var data: [String: Any] = ["messageId": id]
        if let idx = attachmentIndex { data["attachmentIndex"] = idx }
        onMessagePress?(data)
    }

    func chatDidSelectAction(actionId: String, messageId: String) {
        onActionPress?(["actionId": actionId, "messageId": messageId])
    }

    func chatDidSelectEmojiReaction(emoji: String, messageId: String) {
        onEmojiReactionSelect?(["emoji": emoji, "messageId": messageId])
    }

    func chatDidTapReaction(messageId: String, emoji: String) {
        onReactionTap?(["emoji": emoji, "messageId": messageId])
    }

    func chatDidSendMessage(text: String, replyToId: String?) {
        var data: [String: Any] = ["text": text]
        if let id = replyToId { data["replyToId"] = id }
        onSendMessage?(data)
    }

    func chatDidEditMessage(text: String, messageId: String) {
        onEditMessage?(["text": text, "messageId": messageId])
    }

    func chatDidCancelInputAction(type: String) {
        onCancelInputAction?(["type": type])
    }

    func chatDidTapAttachment() {
        onAttachmentPress?([:])
    }

    func chatDidTapReplyMessage(id: String) {
        onReplyMessagePress?(["messageId": id])
    }



    func chatDidTapPollOption(messageId: String, pollId: String, optionId: String) {
        onPollOptionPress?(["messageId": messageId, "pollId": pollId, "optionId": optionId])
    }

    func chatDidTapPollDetail(messageId: String, pollId: String) {
        onPollDetailPress?(["messageId": messageId, "pollId": pollId])
    }

    func chatDidCompleteVoiceRecording(fileURL: URL, duration: TimeInterval) {
        onVoiceRecordingComplete?(["fileUrl": fileURL.absoluteString, "duration": duration])
    }

    func chatDidChangeInputText(_ text: String) {
        let throttleMs = inputTypingThrottle.doubleValue
        let now = CACurrentMediaTime() * 1000
        guard now - lastTypingTime >= throttleMs else { return }
        lastTypingTime = now
        onInputTyping?(["text": text])
    }

}

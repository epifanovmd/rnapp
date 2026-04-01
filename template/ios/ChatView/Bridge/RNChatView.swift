// MARK: - RNChatView.swift

import UIKit
import React

// MARK: - ChatInputAction

enum ChatInputAction {
    case reply(messageId: String)
    case edit(messageId: String)
    case none

    init(dict: [String: Any]?) {
        guard
            let dict,
            let type      = dict["type"] as? String,
            let messageId = dict["messageId"] as? String,
            !messageId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else {
            self = .none
            return
        }
        switch type {
        case "reply": self = .reply(messageId: messageId)
        case "edit":  self = .edit(messageId: messageId)
        default:      self = .none
        }
    }
}

// MARK: - RNChatView

@objc final class RNChatView: UIView {

    // MARK: - Events

    @objc var onScroll:              RCTDirectEventBlock?
    @objc var onReachTop:            RCTDirectEventBlock?
    @objc var onReachBottom:         RCTDirectEventBlock?
    @objc var onMessagesVisible:     RCTDirectEventBlock?
    @objc var onMessagePress:        RCTDirectEventBlock?
    @objc var onActionPress:         RCTDirectEventBlock?
    @objc var onEmojiReactionSelect: RCTDirectEventBlock?
    @objc var onSendMessage:         RCTDirectEventBlock?
    @objc var onEditMessage:         RCTDirectEventBlock?
    @objc var onCancelInputAction:   RCTDirectEventBlock?
    @objc var onAttachmentPress:     RCTDirectEventBlock?
    @objc var onReplyMessagePress:   RCTDirectEventBlock?
    @objc var onVideoPress:          RCTDirectEventBlock?
    @objc var onPollOptionPress:     RCTDirectEventBlock?
    @objc var onPollDetailPress:     RCTDirectEventBlock?
    @objc var onFilePress:           RCTDirectEventBlock?
    @objc var onVoiceRecordingComplete: RCTDirectEventBlock?

    // MARK: - Props

    @objc var messages: NSArray = [] {
        didSet { updateMessages() }
    }

    /// Список эмодзи для панели контекстного меню.
    @objc var emojiReactions: NSArray = [] {
        didSet { updateEmojiReactions() }
    }

    @objc var hasMore: Bool = false {
        didSet { chatVC?.hasMore = hasMore }
    }

    @objc var hasNewer: Bool = false {
        didSet { chatVC?.hasNewer = hasNewer }
    }

    @objc var topThreshold: NSNumber = 200 {
        didSet { chatVC?.topThreshold = CGFloat(topThreshold.doubleValue) }
    }

    @objc var bottomThreshold: NSNumber = 200 {
        didSet { chatVC?.bottomThreshold = CGFloat(bottomThreshold.doubleValue) }
    }

    @objc var isLoading: Bool = false {
        didSet {
            chatVC?.isLoading = isLoading
            if !isLoading { chatVC?.resetLoadingState() }
        }
    }

    @objc var isLoadingBottom: Bool = false {
        didSet {
            chatVC?.isLoadingBottom = isLoadingBottom
            if !isLoadingBottom { chatVC?.resetLoadingBottomState() }
        }
    }

    @objc var inputAction: NSDictionary? {
        didSet { applyInputAction() }
    }

    @objc var initialScrollId: NSString? {
        didSet { pendingInitialScrollId = initialScrollId as String? }
    }

    @objc var scrollToBottomThreshold: NSNumber = 150 {
        didSet { chatVC?.scrollToBottomThreshold = CGFloat(scrollToBottomThreshold.doubleValue) }
    }

    @objc var theme: NSString = "light" {
        didSet { applyTheme() }
    }

    @objc var collectionInsetTop: NSNumber = 0 {
        didSet { chatVC?.collectionExtraInsetTop = CGFloat(collectionInsetTop.doubleValue) }
    }

    @objc var collectionInsetBottom: NSNumber = 0 {
        didSet { chatVC?.collectionExtraInsetBottom = CGFloat(collectionInsetBottom.doubleValue) }
    }

    // MARK: - Private state

    private weak var chatVC: ChatViewController?
    private var pendingInitialScrollId: String?
    private var initialScrollDone      = false
    private var isAttachedToHierarchy  = false

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    // MARK: - Setup

    private func setup() {
        backgroundColor = .clear
        let vc = ChatViewController()
        vc.delegate = self
        chatVC = vc
        vc.view.frame            = bounds
        vc.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        vc.view.backgroundColor  = .clear
        addSubview(vc.view)
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()

        if window == nil {
            // Chat unmounted — stop any playing voice
            VoicePlayer.shared.stop()
            return
        }

        guard
            !isAttachedToHierarchy,
            let vc = chatVC,
            vc.parent == nil,
            let parentVC = findParentViewController()
        else { return }

        isAttachedToHierarchy = true
        parentVC.addChild(vc)
        vc.didMove(toParent: parentVC)
    }

    // MARK: - Prop handlers

    private func applyTheme() {
        chatVC?.theme = (theme as String).lowercased() == "dark" ? .dark : .light
    }

    private func updateMessages() {
        guard let vc = chatVC else { return }

        let parsed: [ChatMessage] = (messages as? [[String: Any]] ?? [])
            .compactMap { ChatMessage.from(dict: $0) }

        vc.updateMessages(parsed)

        guard !initialScrollDone, !parsed.isEmpty else { return }
        initialScrollDone = true
        if let targetId = pendingInitialScrollId {
            vc.isInitialScrollProtected = true
            vc.pendingScrollMessageId   = targetId
        }
        performInitialScroll(in: vc)
    }

    private func performInitialScroll(in vc: ChatViewController) {
        vc.view.layoutIfNeeded()
        DispatchQueue.main.async { [weak self, weak vc] in
            guard let self, let vc else { return }
            vc.view.layoutIfNeeded()
            if let id = self.pendingInitialScrollId {
                self.pendingInitialScrollId = nil
                vc.scrollToMessage(id: id, position: .center, animated: false, highlight: true)
                vc.isInitialScrollProtected = false
                vc.pendingScrollMessageId   = nil
            } else {
                vc.scrollToBottom(animated: false)
            }
        }
    }

    private func updateEmojiReactions() {
        guard let vc = chatVC else { return }
        vc.emojiReactionsList = emojiReactions as? [String] ?? []
    }

    private func applyInputAction() {
        guard let vc = chatVC else { return }

        switch ChatInputAction(dict: inputAction as? [String: Any]) {

        case .reply(let messageId):
            guard let message = vc.message(forID: messageId) else { return }
            vc.beginReply(info: ReplyInfo(
                replyToId:  message.id,
                senderName: message.senderName,
                text:       message.text,
                hasImage:   message.hasImage
            ))

        case .edit(let messageId):
            guard
                let message = vc.message(forID: messageId),
                let text    = message.text
            else { return }
            vc.beginEdit(messageId: messageId, text: text)

        case .none:
            vc.clearInputMode()
        }
    }

    // MARK: - Helpers

    private func findParentViewController() -> UIViewController? {
        var responder: UIResponder? = self
        while let r = responder {
            if let vc = r as? UIViewController { return vc }
            responder = r.next
        }
        return nil
    }

    // MARK: - JS Commands

    @objc func scrollToBottom() {
        chatVC?.scrollToBottom(animated: true)
    }

    @objc func scrollToMessage(
        id messageId: String,
        position positionStr: String?,
        animated: Bool,
        highlight: Bool
    ) {
        let position: ChatScrollPosition
        switch positionStr?.lowercased() {
        case "top":    position = .top
        case "bottom": position = .bottom
        default:       position = .center
        }
        chatVC?.scrollToMessage(id: messageId, position: position, animated: animated, highlight: highlight)
    }
}

// MARK: - ChatViewControllerDelegate

extension RNChatView: ChatViewControllerDelegate {

    func chatViewController(_ vc: ChatViewController, didScrollToOffset offset: CGPoint) {
        onScroll?(["x": offset.x, "y": offset.y])
    }

    func chatViewController(_ vc: ChatViewController, didReachTopThreshold threshold: CGFloat) {
        onReachTop?(["distanceFromTop": threshold])
    }

    func chatViewController(_ vc: ChatViewController, didReachBottomThreshold distance: CGFloat) {
        onReachBottom?(["distanceFromBottom": distance])
    }

    func chatViewController(_ vc: ChatViewController, messagesDidAppear messageIDs: [String]) {
        onMessagesVisible?(["messageIds": messageIDs])
    }

    func chatViewController(_ vc: ChatViewController, didTapMessage message: ChatMessage) {
        onMessagePress?(["messageId": message.id])
    }

    func chatViewController(_ vc: ChatViewController, didSelectAction action: MessageAction,
                            for message: ChatMessage) {
        onActionPress?(["actionId": action.id, "messageId": message.id])
    }

    func chatViewController(_ vc: ChatViewController, didSelectEmojiReaction emoji: String,
                            for message: ChatMessage) {
        onEmojiReactionSelect?(["emoji": emoji, "messageId": message.id])
    }

    func chatViewController(_ vc: ChatViewController, didSendMessage text: String,
                            replyToId: String?) {
        var payload: [String: Any] = ["text": text]
        if let rid = replyToId { payload["replyToId"] = rid }
        onSendMessage?(payload)
    }

    func chatViewController(_ vc: ChatViewController, didEditMessage text: String,
                            messageId: String) {
        onEditMessage?(["text": text, "messageId": messageId])
    }

    func chatViewController(_ vc: ChatViewController, didCancelReply _: ChatViewController) {
        onCancelInputAction?(["type": "reply"])
    }

    func chatViewController(_ vc: ChatViewController, didCancelEdit _: ChatViewController) {
        onCancelInputAction?(["type": "edit"])
    }

    func chatViewControllerDidTapAttachment(_ vc: ChatViewController) {
        onAttachmentPress?([:])
    }

    func chatViewController(_ vc: ChatViewController, didTapReply replyId: String) {
        onReplyMessagePress?(["messageId": replyId])
    }

    func chatViewController(_ vc: ChatViewController, didTapVideo videoUrl: String,
                            for message: ChatMessage) {
        onVideoPress?(["messageId": message.id, "videoUrl": videoUrl])
    }

    func chatViewController(_ vc: ChatViewController, didTapPollOption optionId: String,
                            pollId: String, for message: ChatMessage) {
        onPollOptionPress?(["messageId": message.id, "pollId": pollId, "optionId": optionId])
    }

    func chatViewController(_ vc: ChatViewController, didTapPollDetail pollId: String,
                            for message: ChatMessage) {
        onPollDetailPress?(["messageId": message.id, "pollId": pollId])
    }

    func chatViewController(_ vc: ChatViewController, didTapFile fileUrl: String,
                            fileName: String, for message: ChatMessage) {
        onFilePress?(["messageId": message.id, "fileUrl": fileUrl, "fileName": fileName])
    }

    func chatViewController(_ vc: ChatViewController, didFinishVoiceRecording fileURL: URL, duration: TimeInterval) {
        onVoiceRecordingComplete?([
            "fileUrl": fileURL.absoluteString,
            "duration": duration,
        ])
    }
}

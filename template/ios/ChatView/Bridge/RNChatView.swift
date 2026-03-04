// MARK: - RNChatView.swift
// React Native New Architecture - Fabric component view

import UIKit
import React

@objc final class RNChatView: UIView {

    // MARK: - Events

    @objc var onScroll: RCTDirectEventBlock?
    @objc var onReachTop: RCTDirectEventBlock?
    @objc var onMessagesVisible: RCTDirectEventBlock?
    @objc var onMessagePress: RCTDirectEventBlock?
    @objc var onActionPress: RCTDirectEventBlock?
    @objc var onSendMessage: RCTDirectEventBlock?
    @objc var onAttachmentPress: RCTDirectEventBlock?
    @objc var onReplyMessagePress: RCTDirectEventBlock?

    // MARK: - Props

    @objc var messages: NSArray = [] {
        didSet { updateMessages() }
    }

    @objc var actions: NSArray = [] {
        didSet { updateActions() }
    }

    @objc var topThreshold: NSNumber = 200 {
        didSet { chatViewController?.topThreshold = CGFloat(topThreshold.doubleValue) }
    }

    @objc var isLoading: NSNumber = 0 {
        didSet { chatViewController?.isLoading = isLoading.boolValue }
    }

    @objc var replyMessage: NSDictionary? {
        didSet { updateReplyMessage() }
    }

    /// When set, the chat will scroll to this message on initial load instead
    /// of scrolling to the bottom. Only consumed once.
    @objc var initialScrollToMessageId: NSString? {
        didSet {
            // Store it; will be applied after first messages update.
            pendingInitialScrollMessageId = initialScrollToMessageId as String?
        }
    }

    /// Distance from bottom (pts) at which the scroll-to-bottom FAB becomes visible.
    @objc var scrollToBottomThreshold: NSNumber = 150 {
        didSet {
            chatViewController?.scrollToBottomThreshold = CGFloat(scrollToBottomThreshold.doubleValue)
        }
    }

    // MARK: - Internal

    private weak var chatViewController: ChatViewController?
    private var hostController: UIViewController?

    /// Message ID to scroll to on first data load. Cleared after first use.
    private var pendingInitialScrollMessageId: String?
    /// Whether the initial scroll has already been performed.
    private var initialScrollDone = false

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
        setupChatView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        backgroundColor = .clear
        setupChatView()
    }

    // MARK: - Setup

    private func setupChatView() {
        let vc = ChatViewController()
        vc.delegate = self
        chatViewController = vc

        vc.view.frame = bounds
        vc.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        vc.view.backgroundColor = .clear
        addSubview(vc.view)

        if let parentVC = findParentViewController() {
            parentVC.addChild(vc)
            vc.didMove(toParent: parentVC)
            hostController = parentVC
        }
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard let vc = chatViewController, vc.parent == nil else { return }
        if let parentVC = findParentViewController() {
            parentVC.addChild(vc)
            vc.didMove(toParent: parentVC)
            hostController = parentVC
        }
    }

    // MARK: - Updates

    private func updateMessages() {
        guard let chatVC = chatViewController else { return }
        let parsed: [ChatMessage] = (messages as? [[String: Any]] ?? [])
            .compactMap { ChatMessage.from(dict: $0) }

        chatVC.updateMessages(parsed)

        // Perform initial scroll exactly once, after the first batch of messages.
        if !initialScrollDone && !parsed.isEmpty {
            initialScrollDone = true
            performInitialScroll(messages: parsed, in: chatVC)
        }
    }

    private func performInitialScroll(messages: [ChatMessage], in chatVC: ChatViewController) {
        // Force layout pass so contentSize is correct before scrolling.
        chatVC.view.layoutIfNeeded()

        // One tick to let the diffable data source finish cell sizing.
        DispatchQueue.main.async { [weak self, weak chatVC] in
            guard let self, let chatVC else { return }
            chatVC.view.layoutIfNeeded()

            if let targetId = self.pendingInitialScrollMessageId {
                self.pendingInitialScrollMessageId = nil
                chatVC.scrollToMessage(
                    id: targetId,
                    position: .center,
                    animated: false,
                    highlight: true
                )
            } else {
                chatVC.scrollToBottom(animated: false)
            }
        }
    }

    private func updateActions() {
        guard let chatVC = chatViewController else { return }
        let parsed: [MessageAction] = (actions as? [[String: Any]] ?? [])
            .compactMap { MessageAction.from(dict: $0) }
        chatVC.actions = parsed
    }

    private func updateReplyMessage() {
        guard let chatVC = chatViewController else { return }
        if let dict = replyMessage as? [String: Any], !dict.isEmpty,
           let msg = ChatMessage.from(dict: dict) {
            chatVC.setReplyMessage(msg)
        } else {
            chatVC.setReplyMessage(nil)
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

    // MARK: - Public API (commands from JS)

    @objc func scrollToBottom() {
        chatViewController?.scrollToBottom(animated: true)
    }

    @objc func scrollToMessage(
        id messageID: String,
        position positionString: String?,
        animated: Bool,
        highlight: Bool
    ) {
        let position: ChatScrollPosition
        switch positionString?.lowercased() {
        case "top":    position = .top
        case "bottom": position = .bottom
        default:       position = .center
        }
        chatViewController?.scrollToMessage(
            id: messageID,
            position: position,
            animated: animated,
            highlight: highlight
        )
    }
}

// MARK: - ChatViewControllerDelegate

extension RNChatView: ChatViewControllerDelegate {

    func chatViewController(_ controller: ChatViewController, didScrollToOffset offset: CGPoint) {
        onScroll?(["x": offset.x, "y": offset.y])
    }

    func chatViewController(_ controller: ChatViewController, didReachTopThreshold threshold: CGFloat) {
        onReachTop?(["distanceFromTop": threshold])
    }

    func chatViewController(_ controller: ChatViewController, messagesDidAppear messageIDs: [String]) {
        onMessagesVisible?(["messageIds": messageIDs])
    }

    func chatViewController(_ controller: ChatViewController, didTapMessage message: ChatMessage) {
        onMessagePress?(["messageId": message.id, "message": messagePayload(from: message)])
    }

    func chatViewController(_ controller: ChatViewController, didSelectAction action: MessageAction, for message: ChatMessage) {
        onActionPress?(["actionId": action.id, "messageId": message.id, "message": messagePayload(from: message)])
    }

    func chatViewController(_ controller: ChatViewController, didSendMessage text: String, replyToId: String?) {
        var payload: [String: Any] = ["text": text]
        if let rid = replyToId { payload["replyToId"] = rid }
        onSendMessage?(payload)
    }

    func chatViewControllerDidTapAttachment(_ controller: ChatViewController) {
        onAttachmentPress?([:])
    }

    func chatViewController(_ controller: ChatViewController, didTapReply replyId: String) {
        onReplyMessagePress?(["messageId": replyId])
    }

    // MARK: - Payload

    private func messagePayload(from message: ChatMessage) -> [String: Any] {
        var dict: [String: Any] = [
            "id": message.id,
            "timestamp": message.timestamp.timeIntervalSince1970 * 1000,
            "isMine": message.isMine,
            "status": message.status.rawValue,
        ]
        if let text = message.text { dict["text"] = text }
        if let name = message.senderName { dict["senderName"] = name }
        if let images = message.images {
            dict["images"] = images.map { img -> [String: Any] in
                var d: [String: Any] = ["url": img.url]
                if let w = img.width  { d["width"]  = w }
                if let h = img.height { d["height"] = h }
                if let t = img.thumbnailUrl { d["thumbnailUrl"] = t }
                return d
            }
        }
        if let reply = message.replyTo {
            dict["replyTo"] = [
                "id": reply.id,
                "text": reply.text as Any,
                "senderName": reply.senderName as Any,
            ]
        }
        return dict
    }
}

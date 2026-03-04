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

    // Fix #13: Используем Bool вместо NSNumber для совместимости с New Architecture codegen.
    // При Old Architecture React Native передаёт NSNumber(bool:), при New — BOOL напрямую.
    // Явный Bool устраняет потенциальный крэш при миграции на Fabric.
    @objc var isLoading: Bool = false {
        didSet {
            chatViewController?.isLoading = isLoading
            // Fix #5: Сбрасываем waitingForNewMessages когда загрузка завершена.
            // Без этого, если JS не вернул новые сообщения (ошибка / конец истории),
            // флаг оставался true навсегда и пользователь не мог подгрузить историю.
            if !isLoading {
                chatViewController?.resetLoadingState()
            }
        }
    }

    @objc var replyMessage: NSDictionary? {
        didSet { updateReplyMessage() }
    }

    @objc var initialScrollId: NSString? {
        didSet {
            pendingInitialScrollMessageId = initialScrollId as String?
        }
    }

    @objc var scrollToBottomThreshold: NSNumber = 150 {
        didSet {
            chatViewController?.scrollToBottomThreshold =
                CGFloat(scrollToBottomThreshold.doubleValue)
        }
    }

    // MARK: - Internal

    private weak var chatViewController: ChatViewController?
    private var hostController: UIViewController?

    private var pendingInitialScrollMessageId: String?
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
    //
    // Fix #6: findParentViewController вынесен из init — в момент init
    // responder chain в React Native ещё не установлен, и поиск ViewController
    // может вернуть nil или неверный объект.
    // Теперь ChatViewController добавляется как child только в didMoveToWindow,
    // когда иерархия view гарантированно стабилизирована.

    private func setupChatView() {
        let vc = ChatViewController()
        vc.delegate = self
        chatViewController = vc

        vc.view.frame = bounds
        vc.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        vc.view.backgroundColor = .clear
        addSubview(vc.view)
        // Добавление как child откладывается до didMoveToWindow
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard window != nil, let vc = chatViewController else { return }
        // Добавляем как child только один раз
        guard vc.parent == nil else { return }
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

        if !initialScrollDone && !parsed.isEmpty {
            initialScrollDone = true

            if let targetId = pendingInitialScrollMessageId {
                chatVC.isInitialScrollProtected = true
                chatVC.pendingScrollMessageId   = targetId
            }

            performInitialScroll(messages: parsed, in: chatVC)
        }
    }

    private func performInitialScroll(messages: [ChatMessage], in chatVC: ChatViewController) {
        chatVC.view.layoutIfNeeded()

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
                chatVC.isInitialScrollProtected = false
                chatVC.pendingScrollMessageId   = nil
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

    // Fix #6: вызывается только из didMoveToWindow, когда window != nil
    // и responder chain гарантированно установлен.
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

    func chatViewController(_ controller: ChatViewController,
                            didReachTopThreshold threshold: CGFloat) {
        onReachTop?(["distanceFromTop": threshold])
    }

    func chatViewController(_ controller: ChatViewController,
                            messagesDidAppear messageIDs: [String]) {
        onMessagesVisible?(["messageIds": messageIDs])
    }

    func chatViewController(_ controller: ChatViewController, didTapMessage message: ChatMessage) {
        onMessagePress?(["messageId": message.id, "message": messagePayload(from: message)])
    }

    func chatViewController(_ controller: ChatViewController, didSelectAction action: MessageAction,
                            for message: ChatMessage) {
        onActionPress?(["actionId": action.id, "messageId": message.id,
                        "message": messagePayload(from: message)])
    }

    func chatViewController(_ controller: ChatViewController, didSendMessage text: String,
                            replyToId: String?) {
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
        return dict
    }
}

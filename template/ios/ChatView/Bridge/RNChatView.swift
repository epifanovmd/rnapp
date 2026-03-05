// MARK: - RNChatView.swift
// React Native New Architecture — Fabric component view.
// Получает пропсы из JS, транслирует в ChatViewController.
// Тема переключается через проп `theme` ("light" | "dark").

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
    @objc var onEditMessage: RCTDirectEventBlock?
    @objc var onCancelReply: RCTDirectEventBlock?
    @objc var onCancelEdit: RCTDirectEventBlock?
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

    @objc var isLoading: Bool = false {
        didSet {
            chatViewController?.isLoading = isLoading
            if !isLoading { chatViewController?.resetLoadingState() }
        }
    }

    /// Сериализованные данные цитируемого сообщения из JS.
    @objc var replyMessage: NSDictionary? {
        didSet { updateReplyMessage() }
    }

    /// Сериализованные данные редактируемого сообщения из JS.
    @objc var editMessage: NSDictionary? {
        didSet { updateEditMessage() }
    }

    @objc var initialScrollId: NSString? {
        didSet { pendingInitialScrollMessageId = initialScrollId as String? }
    }

    @objc var scrollToBottomThreshold: NSNumber = 150 {
        didSet {
            chatViewController?.scrollToBottomThreshold =
                CGFloat(scrollToBottomThreshold.doubleValue)
        }
    }

    /// Тема оформления: "light" или "dark". По умолчанию — light.
    @objc var theme: NSString = "light" {
        didSet { applyTheme() }
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

    private func setupChatView() {
        let vc = ChatViewController()
        vc.delegate = self
        chatViewController = vc

        vc.view.frame = bounds
        vc.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        vc.view.backgroundColor  = .clear
        addSubview(vc.view)
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard window != nil, let vc = chatViewController else { return }
        guard vc.parent == nil else { return }
        if let parentVC = findParentViewController() {
            parentVC.addChild(vc)
            vc.didMove(toParent: parentVC)
            hostController = parentVC
        }
    }

    // MARK: - Theme

    /// Преобразует строковый проп в ChatTheme и передаёт контроллеру.
    private func applyTheme() {
        let resolved: ChatTheme = (theme as String).lowercased() == "dark" ? .dark : .light
        chatViewController?.theme = resolved
    }

    // MARK: - Prop updates

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
                chatVC.scrollToMessage(id: targetId, position: .center,
                                       animated: false, highlight: true)
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

    /// Парсит replyMessage из JS и передаёт ReplyInfo в контроллер.
    private func updateReplyMessage() {
        guard let chatVC = chatViewController else { return }
        if let dict = replyMessage as? [String: Any], !dict.isEmpty,
           let info = ReplyInfo.from(dict: dict) {
            chatVC.setReplyInfo(info)
        } else {
            chatVC.setReplyInfo(nil)
        }
    }

    /// Парсит editMessage из JS и переводит InputBar в режим редактирования.
    /// Ожидаемые поля: "id" (String), "text" (String).
    private func updateEditMessage() {
        guard let chatVC = chatViewController else { return }
        if let dict = editMessage as? [String: Any],
           let id   = dict["id"]   as? String, !id.isEmpty,
           let text = dict["text"] as? String {
            chatVC.setEditMessage(id: id, text: text)
        } else {
            // JS обнулил editMessage — сбрасываем режим без события делегата
            chatVC.clearInputMode()
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
            id: messageID, position: position,
            animated: animated, highlight: highlight)
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
        onMessagePress?(["messageId": message.id])
    }

    func chatViewController(_ controller: ChatViewController, didSelectAction action: MessageAction,
                            for message: ChatMessage) {
        onActionPress?(["actionId": action.id, "messageId": message.id])
    }

    func chatViewController(_ controller: ChatViewController, didSendMessage text: String,
                            replyToId: String?) {
        var payload: [String: Any] = ["text": text]
        if let rid = replyToId { payload["replyToId"] = rid }
        onSendMessage?(payload)
    }

    /// Пользователь отправил отредактированный текст.
    func chatViewController(_ controller: ChatViewController, didEditMessage text: String,
                            messageId: String) {
        onEditMessage?(["text": text, "messageId": messageId])
    }

    /// Пользователь нажал ✕ в панели ответа.
    func chatViewController(_ controller: ChatViewController,
                            didCancelReply vc2: ChatViewController) {
        onCancelReply?([:])
    }

    /// Пользователь нажал ✕ в панели редактирования.
    func chatViewController(_ controller: ChatViewController,
                            didCancelEdit vc2: ChatViewController) {
        onCancelEdit?([:])
    }

    func chatViewControllerDidTapAttachment(_ controller: ChatViewController) {
        onAttachmentPress?([:])
    }

    func chatViewController(_ controller: ChatViewController, didTapReply replyId: String) {
        onReplyMessagePress?(["messageId": replyId])
    }
}

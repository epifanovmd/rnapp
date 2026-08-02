import IOSChatView
import UIKit
import React

final class RNChatView: UIView {

    // MARK: - Event Handlers

    @objc var onScroll: RCTDirectEventBlock?
    @objc var onReachTop: RCTDirectEventBlock?
    @objc var onReachBottom: RCTDirectEventBlock?
    @objc var onVisibleMessagesChange: RCTDirectEventBlock?
    @objc var onUnreadMessagesAppear: RCTDirectEventBlock?
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
    @objc var onThreadTap: RCTDirectEventBlock?
    @objc var onLinkTap: RCTDirectEventBlock?
    @objc var onPhoneNumberTap: RCTDirectEventBlock?
    @objc var onFabPress: RCTDirectEventBlock?
    @objc var onScrollAnchorChanged: RCTDirectEventBlock?

    // MARK: - Props

    @objc var messages: NSArray = [] {
        didSet {
            guard messages != lastAppliedMessages else { return }
            lastAppliedMessages = messages
            applyMessages()
        }
    }

    @objc var hasMore: Bool = false {
        didSet { chatVC.hasMore = hasMore }
    }

    @objc var hasNewer: Bool = false {
        didSet { chatVC.hasNewer = hasNewer }
    }

    @objc var isLoading: Bool = false {
        didSet { chatVC.isLoading = isLoading }
    }

    @objc var emptyStateText: NSString = "" {
        didSet {
            chatVC.emptyStateText = (emptyStateText.length > 0) ? (emptyStateText as String) : nil
        }
    }

    @objc var isLoadingTop: Bool = false {
        didSet { chatVC.isLoadingTop = isLoadingTop }
    }

    @objc var isLoadingBottom: Bool = false {
        didSet { chatVC.isLoadingBottom = isLoadingBottom }
    }

    @objc var isLoadingFab: Bool = false {
        didSet { chatVC.isLoadingFab = isLoadingFab }
    }

    @objc var inputAction: NSDictionary? {
        didSet {
            guard inputAction != lastAppliedInputAction else { return }
            lastAppliedInputAction = inputAction
            applyInputAction()
        }
    }

    /// Pixel-accurate scroll anchor for initial restore.
    /// Only sets pendingScrollAnchor — protection is activated by applyInitial.
    @objc var initialScrollAnchor: NSDictionary? {
        didSet {
            guard let dict = initialScrollAnchor,
                  let messageId = dict["messageId"] as? String,
                  !messageId.isEmpty else {
                chatVC.pendingScrollAnchor = nil
                return
            }
            let offset = (dict["offset"] as? NSNumber)?.doubleValue ?? 0
            let wasAtBottom = dict["wasAtBottom"] as? Bool ?? false

            chatVC.pendingScrollAnchor = ScrollAnchor(
                messageId: messageId,
                offset: CGFloat(offset),
                wasAtBottom: wasAtBottom
            )
        }
    }

    @objc var theme: NSString = "light" {
        didSet { chatVC.theme = (theme == "dark") ? .dark : .light }
    }

    @objc var collectionInsetTop: NSNumber = 0 {
        didSet { chatVC.collectionExtraInsetTop = CGFloat(collectionInsetTop.doubleValue) }
    }

    @objc var collectionInsetBottom: NSNumber = 0 {
        didSet { chatVC.collectionExtraInsetBottom = CGFloat(collectionInsetBottom.doubleValue) }
    }

    @objc var inputTypingThrottle: NSNumber = 500

    @objc var visibleMessagesThrottleInterval: NSNumber = 0.3 {
        didSet { chatVC.visibleMessagesThrottleInterval = visibleMessagesThrottleInterval.doubleValue }
    }

    @objc var unreadMessagesDebounceInterval: NSNumber = 0.3 {
        didSet { chatVC.unreadMessagesDebounceInterval = unreadMessagesDebounceInterval.doubleValue }
    }

    @objc var visibilityThreshold: NSNumber = 0.8 {
        didSet { chatVC.visibilityThreshold = CGFloat(visibilityThreshold.doubleValue) }
    }

    @objc var unreadVisibilityThreshold: NSNumber = 0.5 {
        didSet { chatVC.unreadVisibilityThreshold = CGFloat(unreadVisibilityThreshold.doubleValue) }
    }

    @objc var unreadCount: NSNumber = -1 {
        didSet {
            let value = unreadCount.intValue
            if value >= 0 {
                chatVC.setUnreadCount(value)
            }
        }
    }

    @objc var features: NSDictionary? {
        didSet {
            guard features != lastAppliedFeatures else { return }
            lastAppliedFeatures = features
            applyFeatures()
        }
    }

    @objc var layout: NSDictionary? {
        didSet {
            guard layout != lastAppliedLayout else { return }
            lastAppliedLayout = layout
            applyLayout()
        }
    }

    // MARK: - Internal

    private let chatVC = ChatViewController()
    private var isSetup = false
    private var lastTypingTime: CFTimeInterval = 0
    private var messageCache: [String: (dict: NSDictionary, msg: ChatMessage)] = [:]
    private var lastAppliedMessages: NSArray?
    private var lastAppliedInputAction: NSDictionary?
    private var lastAppliedFeatures: NSDictionary?
    private var lastAppliedLayout: NSDictionary?

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

        // chatVC.view triggers viewDidLoad which creates the view at 390x844 (screen size).
        // keyboardLayoutGuide adds a CABasicAnimation(bounds.size, 0.2s) on its tracking UIView.
        // When constraints shrink the view to match the zero-sized parent, that animation
        // makes the transition visible as a "fly-in from top" effect.
        // Fix: set frame to zero BEFORE constraints and suppress all implicit animations.
        UIView.performWithoutAnimation {
            CATransaction.begin()
            CATransaction.setDisableActions(true)

            chatVC.view.frame = bounds  // zero at this point — prevents 844→0 transition
            chatVC.view.translatesAutoresizingMaskIntoConstraints = false
            addSubview(chatVC.view)

            NSLayoutConstraint.activate([
                chatVC.view.topAnchor.constraint(equalTo: topAnchor),
                chatVC.view.leadingAnchor.constraint(equalTo: leadingAnchor),
                chatVC.view.trailingAnchor.constraint(equalTo: trailingAnchor),
                chatVC.view.bottomAnchor.constraint(equalTo: bottomAnchor),
            ])

            // Remove any residual animations added by keyboardLayoutGuide setup
            chatVC.view.layer.removeAllAnimations()
            for sub in chatVC.view.subviews {
                sub.layer.removeAllAnimations()
            }

            CATransaction.commit()
        }
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

    func clearUnread() {
        chatVC.clearUnread()
    }

    // MARK: - Private

    private func applyMessages() {
        let raw = messages
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let parsed = raw.compactMap { ($0 as? NSDictionary).flatMap(ChatMessage.from) }
                .sorted { $0.timestamp < $1.timestamp }
            DispatchQueue.main.async {
                self?.chatVC.updateMessages(parsed)
            }
        }
    }

    private func applyFeatures() {
        guard let dict = features else { return }

        chatVC.batchUpdate {
        if let mode = dict["senderNameMode"] as? String {
            switch mode {
            case "never": chatVC.features.senderNameMode = .never
            case "incomingOnly": chatVC.features.senderNameMode = .incomingOnly
            case "always": chatVC.features.senderNameMode = .always
            default: break
            }
        }

        func boolVal(_ key: String) -> Bool? { dict[key] as? Bool }
        func cgVal(_ key: String) -> CGFloat? { (dict[key] as? NSNumber).map { CGFloat($0.doubleValue) } }

        if let v = boolVal("showMessageStatus") { chatVC.features.showMessageStatus = v }
        if let v = boolVal("showTimestamp") { chatVC.features.showTimestamp = v }
        if let v = boolVal("showEditedMark") { chatVC.features.showEditedMark = v }
        if let v = boolVal("showReactions") { chatVC.features.showReactions = v }
        if let v = boolVal("showReplyPreview") { chatVC.features.showReplyPreview = v }
        if let v = boolVal("showForwardedMark") { chatVC.features.showForwardedMark = v }
        if let v = boolVal("showThreadIndicator") { chatVC.features.showThreadIndicator = v }
        if let v = boolVal("linkDetectionEnabled") { chatVC.features.linkDetectionEnabled = v }
        if let v = boolVal("showAvatars") { chatVC.features.showAvatars = v }
        if let v = boolVal("showFab") { chatVC.features.showFab = v }
        if let v = boolVal("showFloatingDate") { chatVC.features.showFloatingDate = v }
        if let v = boolVal("showDateSeparators") { chatVC.features.showDateSeparators = v }
        if let v = boolVal("showTopLoadingIndicator") { chatVC.features.showTopLoadingIndicator = v }
        if let v = boolVal("showBottomLoadingIndicator") { chatVC.features.showBottomLoadingIndicator = v }
        if let v = boolVal("showEmptyState") { chatVC.features.showEmptyState = v }
        if let v = boolVal("showInputBar") { chatVC.features.showInputBar = v }
        if let v = boolVal("showAttachButton") { chatVC.features.showAttachButton = v }
        if let v = boolVal("showVoiceRecording") { chatVC.features.showVoiceRecording = v }
        if let v = boolVal("contextMenuEnabled") { chatVC.features.contextMenuEnabled = v }
        if let v = boolVal("autoScrollOnNewMessage") { chatVC.features.autoScrollOnNewMessage = v }
        if let v = boolVal("disintegrationEnabled") { chatVC.disintegrationEnabled = v }

        if let arr = dict["emojiReactions"] as? [String] { chatVC.features.emojiReactions = arr }
        if let v = cgVal("topLoadThreshold") { chatVC.features.topLoadThreshold = v }
        if let v = cgVal("bottomLoadThreshold") { chatVC.features.bottomLoadThreshold = v }
        if let v = cgVal("scrollToBottomThreshold") { chatVC.features.scrollToBottomThreshold = v }
        } // batchUpdate
    }

    private func applyLayout() {
        guard let dict = layout else { return }

        func cg(_ key: String) -> CGFloat? { (dict[key] as? NSNumber).map { CGFloat($0.doubleValue) } }
        func fl(_ key: String) -> Float? { (dict[key] as? NSNumber)?.floatValue }
        func ti(_ key: String) -> TimeInterval? { (dict[key] as? NSNumber)?.doubleValue }

        chatVC.batchUpdate {

        // Bubble
        if let v = cg("bubbleCornerRadius") { chatVC.layout.bubbleCornerRadius = v }
        if let v = cg("bubbleTailWidth") { chatVC.layout.bubbleTailWidth = v }
        if let v = cg("bubbleMaxWidthRatio") { chatVC.layout.bubbleMaxWidthRatio = v }
        if let v = cg("bubbleMinWidth") { chatVC.layout.bubbleMinWidth = v }
        if let v = cg("bubbleHPad") { chatVC.layout.bubbleHPad = v }
        if let v = cg("bubbleVPad") { chatVC.layout.bubbleVPad = v }
        if let v = cg("bubbleBottomPad") { chatVC.layout.bubbleBottomPad = v }
        if let v = cg("bubbleSpacing") { chatVC.layout.bubbleSpacing = v }
        if let v = cg("mixedContentSpacing") { chatVC.layout.mixedContentSpacing = v }

        // Cell
        if let v = cg("cellHMargin") { chatVC.layout.cellHMargin = v }
        if let v = cg("cellVSpacing") { chatVC.layout.cellVSpacing = v }
        if let v = cg("cellMinHeight") { chatVC.layout.cellMinHeight = v }

        // Footer
        if let v = cg("footerHeight") { chatVC.layout.footerHeight = v }
        if let v = cg("footerSpacing") { chatVC.layout.footerSpacing = v }
        if let v = cg("statusIconSize") { chatVC.layout.statusIconSize = v }

        // Reply preview
        if let v = cg("replyHeight") { chatVC.layout.replyHeight = v }
        if let v = cg("replyAccentWidth") { chatVC.layout.replyAccentWidth = v }
        if let v = cg("replyCornerRadius") { chatVC.layout.replyCornerRadius = v }

        // Reactions
        if let v = cg("reactionChipHeight") { chatVC.layout.reactionChipHeight = v }
        if let v = cg("reactionChipSpacing") { chatVC.layout.reactionChipSpacing = v }
        if let v = cg("reactionChipPadding") { chatVC.layout.reactionChipPadding = v }
        if let v = cg("reactionBorderWidth") { chatVC.layout.reactionBorderWidth = v }

        // Media / images
        if let v = cg("imageMaxHeight") { chatVC.layout.imageMaxHeight = v }
        if let v = cg("imageMinHeight") { chatVC.layout.imageMinHeight = v }
        if let v = cg("imageCornerRadius") { chatVC.layout.imageCornerRadius = v }
        if let v = cg("mediaGridSpacing") { chatVC.layout.mediaGridSpacing = v }
        if let v = cg("mediaPlayIconSize") { chatVC.layout.mediaPlayIconSize = v }

        // Voice
        if let v = cg("voiceWaveformHeight") { chatVC.layout.voiceWaveformHeight = v }
        if let v = cg("voiceBarWidth") { chatVC.layout.voiceBarWidth = v }
        if let v = cg("voiceBarSpacing") { chatVC.layout.voiceBarSpacing = v }
        if let v = cg("voicePlaySize") { chatVC.layout.voicePlaySize = v }
        if let v = cg("voicePlayIconSize") { chatVC.layout.voicePlayIconSize = v }
        if let v = cg("voiceWaveformWidth") { chatVC.layout.voiceWaveformWidth = v }
        if let v = cg("voiceWaveformTrailingInset") { chatVC.layout.voiceWaveformTrailingInset = v }
        if let v = cg("voiceContentSpacing") { chatVC.layout.voiceContentSpacing = v }
        if let v = cg("voiceBarMinHeight") { chatVC.layout.voiceBarMinHeight = v }

        // Poll
        if let v = cg("pollBarHeight") { chatVC.layout.pollBarHeight = v }
        if let v = cg("pollBarCornerRadius") { chatVC.layout.pollBarCornerRadius = v }
        if let v = cg("pollHeaderSpacing") { chatVC.layout.pollHeaderSpacing = v }
        if let v = cg("pollOptionSpacing") { chatVC.layout.pollOptionSpacing = v }
        if let v = cg("pollBarHPad") { chatVC.layout.pollBarHPad = v }
        if let v = ti("pollAnimationDuration") { chatVC.layout.pollAnimationDuration = v }

        // File
        if let v = cg("fileIconSize") { chatVC.layout.fileIconSize = v }
        if let v = cg("fileRowSpacing") { chatVC.layout.fileRowSpacing = v }
        if let v = cg("fileContentSpacing") { chatVC.layout.fileContentSpacing = v }
        if let v = cg("filePadding") { chatVC.layout.filePadding = v }
        if let v = cg("fileCornerRadius") { chatVC.layout.fileCornerRadius = v }

        // Date separator
        if let v = cg("dateSeparatorVPad") { chatVC.layout.dateSeparatorVPad = v }
        if let v = cg("dateSeparatorHPad") { chatVC.layout.dateSeparatorHPad = v }
        if let v = cg("dateSeparatorCornerRadius") { chatVC.layout.dateSeparatorCornerRadius = v }

        // Collection
        if let v = cg("collectionTopPadding") { chatVC.layout.collectionTopPadding = v }
        if let v = cg("collectionBottomPadding") { chatVC.layout.collectionBottomPadding = v }
        if let v = cg("sectionSpacing") { chatVC.layout.sectionSpacing = v }

        // Input bar
        if let v = cg("inputBarMinHeight") { chatVC.layout.inputBarMinHeight = v }
        if let v = cg("inputBarVPad") { chatVC.layout.inputBarVPad = v }
        if let v = cg("inputBarHPad") { chatVC.layout.inputBarHPad = v }
        if let v = cg("textViewMinHeight") { chatVC.layout.textViewMinHeight = v }
        if let v = cg("textViewMaxHeight") { chatVC.layout.textViewMaxHeight = v }
        if let v = cg("textViewCornerRadius") { chatVC.layout.textViewCornerRadius = v }
        if let v = cg("inputReplyPanelHeight") { chatVC.layout.inputReplyPanelHeight = v }
        if let v = cg("inputButtonSize") { chatVC.layout.inputButtonSize = v }
        if let v = cg("inputSeparatorHeight") { chatVC.layout.inputSeparatorHeight = v }
        if let v = cg("inputStackSpacing") { chatVC.layout.inputStackSpacing = v }
        if let v = cg("inputBorderWidth") { chatVC.layout.inputBorderWidth = v }
        if let v = cg("inputIconSize") { chatVC.layout.inputIconSize = v }
        if let v = cg("inputSendButtonInset") { chatVC.layout.inputSendButtonInset = v }
        if let v = cg("inputSendButtonIconSize") { chatVC.layout.inputSendButtonIconSize = v }
        if let v = cg("inputReplyAccentWidth") { chatVC.layout.inputReplyAccentWidth = v }
        if let v = cg("inputPlaceholderLeading") { chatVC.layout.inputPlaceholderLeading = v }
        if let v = dict["inputPlaceholderText"] as? String { chatVC.layout.inputPlaceholderText = v }

        // FAB
        if let v = cg("fabSize") { chatVC.layout.fabSize = v }
        if let v = cg("fabMargin") { chatVC.layout.fabMargin = v }
        if let v = cg("fabTrailingMargin") { chatVC.layout.fabTrailingMargin = v }
        if let v = cg("fabArrowSize") { chatVC.layout.fabArrowSize = v }
        if let v = fl("fabShadowOpacity") { chatVC.layout.fabShadowOpacity = v }
        if let v = cg("fabShadowRadius") { chatVC.layout.fabShadowRadius = v }
        if let v = cg("fabBadgeCornerRadius") { chatVC.layout.fabBadgeCornerRadius = v }
        if let v = cg("fabBadgeHeight") { chatVC.layout.fabBadgeHeight = v }
        if let v = cg("fabBadgeMinWidth") { chatVC.layout.fabBadgeMinWidth = v }
        if let v = cg("fabBadgePadH") { chatVC.layout.fabBadgePadH = v }

        // Bubble shadows
        if let v = fl("bubbleShadowOpacity") { chatVC.layout.bubbleShadowOpacity = v }
        if let v = cg("bubbleShadowRadius") { chatVC.layout.bubbleShadowRadius = v }

        // Animations
        if let v = ti("floatingDateShowDuration") { chatVC.layout.floatingDateShowDuration = v }
        if let v = ti("floatingDateHideDuration") { chatVC.layout.floatingDateHideDuration = v }
        if let v = ti("floatingDateHideDelay") { chatVC.layout.floatingDateHideDelay = v }
        if let v = ti("highlightAnimateIn") { chatVC.layout.highlightAnimateIn = v }
        if let v = ti("highlightAnimateOut") { chatVC.layout.highlightAnimateOut = v }
        if let v = ti("highlightDelay") { chatVC.layout.highlightDelay = v }
        if let v = ti("fabAnimationDuration") { chatVC.layout.fabAnimationDuration = v }

        // Gestures
        if let v = ti("longPressDuration") { chatVC.layout.longPressDuration = v }

        // Empty state
        if let v = cg("emptyStatePadding") { chatVC.layout.emptyStatePadding = v }

        // Scroll
        if let v = ti("scrollThrottleInterval") { chatVC.layout.scrollThrottleInterval = v }
        if let v = ti("paginationDebounceInterval") { chatVC.layout.paginationDebounceInterval = v }
        } // batchUpdate
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
                hasImage: msg.content.content != nil
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
        onScroll?(["x": offset.x, "y": offset.y, "isAtBottom": chatVC.isNearBottom()])
    }

    func chatDidReachTop(distance: CGFloat) {
        onReachTop?(["distanceFromTop": distance])
    }

    func chatDidReachBottom(distance: CGFloat) {
        onReachBottom?(["distanceFromBottom": distance])
    }

    func chatVisibleMessagesDidChange(ids: [String]) {
        onVisibleMessagesChange?([
            "messageIds": ids,
            "isAtBottom": chatVC.isNearBottom()
        ])
    }

    func chatUnreadMessagesDidAppear(ids: [String]) {
        onUnreadMessagesAppear?([
            "messageIds": ids
        ])
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

    func chatDidTapThread(messageId: String, threadId: String) {
        onThreadTap?(["messageId": messageId, "threadId": threadId])
    }

    func chatDidTapLink(url: URL, messageId: String) {
        onLinkTap?(["url": url.absoluteString, "messageId": messageId])
    }

    func chatDidTapPhoneNumber(phoneNumber: String, messageId: String) {
        onPhoneNumberTap?(["phoneNumber": phoneNumber, "messageId": messageId])
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

    /// Взаимодействия из factory-created views (медиа, файлы, опрос, голосовое).
    ///
    /// Пропустить тип здесь — значит молча проглотить жест: под отдаёт всё
    /// через этот один делегат, а `default` ничего не логирует.
    func chatDidContentInteraction(messageId: String, interaction: ChatContentInteraction) {
        switch interaction.type {
        // Тап по вложению открывает просмотрщик на стороне хоста — то же
        // событие, что и тап по пузырю, но с индексом вложения.
        case "mediaTap":
            var data: [String: Any] = ["messageId": messageId]
            if let index = interaction.payload["index"] as? Int {
                data["attachmentIndex"] = index
            }
            onMessagePress?(data)
        // JS-реализация на тап по файлу шлёт onMessagePress без индекса —
        // повторяем, чтобы поведение платформ совпадало.
        case "fileTap":
            onMessagePress?(["messageId": messageId])
        case "pollOptionTap":
            let pollId = interaction.payload["pollId"] as? String ?? ""
            let optionId = interaction.payload["optionId"] as? String ?? ""
            onPollOptionPress?(["messageId": messageId, "pollId": pollId, "optionId": optionId])
        case "pollDetailTap":
            let pollId = interaction.payload["pollId"] as? String ?? ""
            onPollDetailPress?(["messageId": messageId, "pollId": pollId])
        // Воспроизведение голосового живёт внутри пода, наружу его знать не надо
        // (в JS так же: VoiceContent играет сам и onMessagePress не шлёт).
        case "voiceTap":
            break
        default:
            break
        }
    }

    func chatDidTapFAB() {
        onFabPress?([:])
    }

    func chatScrollAnchorChanged(anchor: ScrollAnchor) {
        onScrollAnchorChanged?([
            "messageId": anchor.messageId,
            "offset": anchor.offset,
            "wasAtBottom": anchor.wasAtBottom,
        ])
    }

    func chatDidCompleteVoiceRecording(fileURL: URL, duration: TimeInterval, waveform: [Float]) {
        onVoiceRecordingComplete?([
            "fileUrl": fileURL.absoluteString,
            "duration": duration,
            "waveform": waveform.map { Double($0) },
        ])
    }

    func chatDidChangeInputText(_ text: String) {
        let throttleMs = inputTypingThrottle.doubleValue
        let now = CACurrentMediaTime() * 1000
        guard now - lastTypingTime >= throttleMs else { return }
        lastTypingTime = now
        onInputTyping?(["text": text])
    }

}

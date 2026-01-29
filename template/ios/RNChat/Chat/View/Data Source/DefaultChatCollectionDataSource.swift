//
// ChatLayout
// DefaultChatCollectionDataSource.swift
// https://github.com/ekazaev/ChatLayout
//
// Created by Eugene Kazaev in 2020-2026.
// Distributed under the MIT license.
//
// Become a sponsor:
// https://github.com/sponsors/ekazaev
//

import Foundation
import UIKit

typealias MessageContainerCell<ContentView: UIView> = ContainerCollectionViewCell<MessageContainerView<MainContainerView<AvatarView, MessageBodyView<ContentView>, StatusView>>>
typealias TextMessageCollectionCell = MessageContainerCell<TextMessageView>
typealias ImageCollectionCell = MessageContainerCell<ImageView>
typealias DateSeparatorCollectionCell = ContainerCollectionViewCell<DateSeparatorView>
typealias CustomMessageCollectionCell = MessageContainerCell<CustomMessageView>
typealias SystemMessageCollectionCell = ContainerCollectionViewCell<SystemMessageView>

final class DefaultChatCollectionDataSource: NSObject, ChatCollectionDataSource {
    var onReloadMessage: ((UUID) -> Void)?
    var onReplyTap: ((UUID) -> Void)?

    var configuration: ChatConfiguration {
        didSet {
            imageControllers.removeAll()
        }
    }

    var sections: [Section] = [] {
        didSet {
            oldSections = oldValue
            pruneControllers()
        }
    }

    private var oldSections: [Section] = []
    private var imageControllers: [UUID: ImageController] = [:]

    init(configuration: ChatConfiguration) {
        self.configuration = configuration
        super.init()
    }

    private func pruneControllers() {
        let ids = currentMessageIds()
        imageControllers = imageControllers.filter { ids.contains($0.key) }
    }

    private func currentMessageIds() -> Set<UUID> {
        var result = Set<UUID>()
        result.reserveCapacity(sections.count * 4)
        for section in sections {
            for cell in section.cells {
                if case let .message(message, bubbleType: _) = cell {
                    result.insert(message.id)
                }
            }
        }
        return result
    }

    func prepare(with collectionView: UICollectionView) {
        collectionView.register(TextMessageCollectionCell.self, forCellWithReuseIdentifier: TextMessageCollectionCell.reuseIdentifier)
        collectionView.register(ImageCollectionCell.self, forCellWithReuseIdentifier: ImageCollectionCell.reuseIdentifier)
        collectionView.register(DateSeparatorCollectionCell.self, forCellWithReuseIdentifier: DateSeparatorCollectionCell.reuseIdentifier)
        collectionView.register(CustomMessageCollectionCell.self, forCellWithReuseIdentifier: CustomMessageCollectionCell.reuseIdentifier)
        collectionView.register(SystemMessageCollectionCell.self, forCellWithReuseIdentifier: SystemMessageCollectionCell.reuseIdentifier)
    }

    private func createTextCell(collectionView: UICollectionView, messageId: UUID, indexPath: IndexPath, text: String, date: Date, alignment: ChatItemAlignment, user: ChatUser, bubbleType: Cell.BubbleType, status: MessageStatus, messageType: MessageType, showName: Bool, replyPreview: ReplyPreview?) -> UICollectionViewCell {
        let effectiveBubbleType = resolveBubbleType(bubbleType)
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: TextMessageCollectionCell.reuseIdentifier, for: indexPath) as! TextMessageCollectionCell
        setupMessageContainerView(cell.customView, messageId: messageId, alignment: alignment)
        setupMainMessageView(cell.customView.customView, user: user, alignment: alignment, bubble: effectiveBubbleType, status: status)

        let bubbleView = cell.customView.customView.customView
        let controller = TextMessageController(
            text: text,
            type: messageType,
            configuration: configuration
        )

        buildTextBubbleController(bubbleView: bubbleView, messageType: messageType, bubbleType: effectiveBubbleType)

        bubbleView.customView.contentView.setup(with: controller)
        controller.view = bubbleView.customView.contentView
        bubbleView.customView.applyMeta(name: user.displayName, status: status, configuration: configuration, isIncoming: messageType.isIncoming, date: date, layoutStyle: .stacked, showName: showName)
        bubbleView.customView.applyReply(preview: replyPreview, configuration: configuration, isIncoming: messageType.isIncoming)
        bubbleView.customView.onReplyTap = { [weak self] id in
            self?.onReplyTap?(id)
        }
        cell.delegate = bubbleView.customView.contentView

        return cell
    }

    private func createImageCell(collectionView: UICollectionView, messageId: UUID, indexPath: IndexPath, alignment: ChatItemAlignment, user: ChatUser, source: ImageMessageSource, date: Date, bubbleType: Cell.BubbleType, status: MessageStatus, messageType: MessageType, showName: Bool, replyPreview: ReplyPreview?) -> ImageCollectionCell {
        let effectiveBubbleType = resolveBubbleType(bubbleType)
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: ImageCollectionCell.reuseIdentifier, for: indexPath) as! ImageCollectionCell

        setupMessageContainerView(cell.customView, messageId: messageId, alignment: alignment)
        setupMainMessageView(cell.customView.customView, user: user, alignment: alignment, bubble: effectiveBubbleType, status: status)

        let bubbleView = cell.customView.customView.customView
        let controller = imageControllers[messageId] ?? {
            let controller = ImageController(
                source: source,
                messageId: messageId,
                configuration: configuration
            )
            imageControllers[messageId] = controller
            return controller
        }()

        buildBezierBubbleController(for: bubbleView, messageType: messageType, bubbleType: effectiveBubbleType)

        controller.onReload = { [weak self] id in
            self?.onReloadMessage?(id)
        }
        bubbleView.customView.contentView.setup(with: controller)
        controller.view = bubbleView.customView.contentView
        bubbleView.customView.applyMeta(name: user.displayName, status: status, configuration: configuration, isIncoming: messageType.isIncoming, date: date, layoutStyle: .overlay, showName: showName)
        bubbleView.customView.applyReply(preview: replyPreview, configuration: configuration, isIncoming: messageType.isIncoming)
        bubbleView.customView.onReplyTap = { [weak self] id in
            self?.onReplyTap?(id)
        }
        cell.delegate = bubbleView.customView.contentView

        return cell
    }

    private func createCustomCell(collectionView: UICollectionView, messageId: UUID, indexPath: IndexPath, alignment: ChatItemAlignment, user: ChatUser, custom: CustomMessage, date: Date, bubbleType: Cell.BubbleType, status: MessageStatus, messageType: MessageType, showName: Bool, replyPreview: ReplyPreview?) -> UICollectionViewCell {
        let effectiveBubbleType = resolveBubbleType(bubbleType)
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: CustomMessageCollectionCell.reuseIdentifier, for: indexPath) as! CustomMessageCollectionCell
        setupMessageContainerView(cell.customView, messageId: messageId, alignment: alignment)
        setupMainMessageView(cell.customView.customView, user: user, alignment: alignment, bubble: effectiveBubbleType, status: status)

        let bubbleView = cell.customView.customView.customView
        let text = configuration.behavior.customMessageTextProvider(custom)
        bubbleView.customView.contentView.apply(text: text, configuration: configuration, isIncoming: messageType.isIncoming)
        bubbleView.customView.applyMeta(name: user.displayName, status: status, configuration: configuration, isIncoming: messageType.isIncoming, date: date, layoutStyle: .stacked, showName: showName)
        bubbleView.customView.applyReply(preview: replyPreview, configuration: configuration, isIncoming: messageType.isIncoming)
        bubbleView.customView.onReplyTap = { [weak self] id in
            self?.onReplyTap?(id)
        }

        buildTextBubbleController(bubbleView: bubbleView, messageType: messageType, bubbleType: effectiveBubbleType)
        cell.delegate = bubbleView.customView.contentView

        return cell
    }

    private func createSystemMessageCell(collectionView: UICollectionView, indexPath: IndexPath, message: SystemMessage) -> SystemMessageCollectionCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: SystemMessageCollectionCell.reuseIdentifier, for: indexPath) as! SystemMessageCollectionCell
        cell.customView.apply(text: message.text, configuration: configuration)
        return cell
    }


    private func createDateTitle(collectionView: UICollectionView, indexPath: IndexPath, alignment: ChatItemAlignment, title: String) -> DateSeparatorCollectionCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: DateSeparatorCollectionCell.reuseIdentifier, for: indexPath) as! DateSeparatorCollectionCell
        cell.customView.labelView.preferredMaxLayoutWidth = (collectionView.collectionViewLayout as? CollectionViewChatLayout)?.layoutFrame.width ?? collectionView.frame.width
        cell.customView.labelView.text = title
        cell.customView.apply(configuration: configuration)
        cell.contentView.layoutMargins = configuration.layout.dateSeparatorInsets
        return cell
    }

    private func setupMessageContainerView(_ messageContainerView: MessageContainerView<some Any>, messageId: UUID, alignment: ChatItemAlignment) {
        messageContainerView.alignment = alignment
    }

    private func setupMainMessageView(
        _ cellView: MainContainerView<AvatarView, some Any, StatusView>,
        user: ChatUser,
        alignment: ChatItemAlignment,
        bubble: Cell.BubbleType,
        status: MessageStatus
    ) {
        cellView.containerView.alignment = .bottom
        cellView.containerView.leadingView?.alpha = alignment.isIncoming ? 1 : 0
        cellView.containerView.trailingView?.alpha = alignment.isIncoming ? 0 : 1
        cellView.containerView.trailingView?.isHidden = true
        cellView.containerView.trailingView?.setup(with: status, configuration: configuration)
        cellView.apply(configuration: configuration, alignment: alignment)
        if let avatarView = cellView.containerView.leadingView {
            if configuration.behavior.showsAvatars {
                avatarView.alpha = alignment.isIncoming ? 1 : 0
                let avatarViewController = AvatarViewController(user: user, bubble: bubble, configuration: configuration)
                avatarView.setup(with: avatarViewController)
                avatarViewController.view = avatarView
                avatarView.delegate = cellView.customView.customView as? AvatarViewDelegate
            }
        }
    }

    private func buildTextBubbleController(bubbleView: BezierMaskedView<some Any>, messageType: MessageType, bubbleType: Cell.BubbleType) {
        UIView.performWithoutAnimation {
            let tailSize = configuration.behavior.showsBubbleTail ? configuration.layout.tailSize : 0
            let marginOffset: CGFloat = messageType.isIncoming ? -tailSize : tailSize
            let insets = configuration.layout.bubbleContentInsets
            let edgeInsets = UIEdgeInsets(top: insets.top, left: insets.left - marginOffset, bottom: insets.bottom, right: insets.right + marginOffset)
            bubbleView.layoutMargins = edgeInsets
            bubbleView.backgroundColor = messageType.isIncoming ? configuration.colors.incomingBubble : configuration.colors.outgoingBubble
        }

        bubbleView.bubbleCornerRadius = configuration.layout.bubbleCornerRadius
        bubbleView.messageType = messageType
        bubbleView.bubbleType = bubbleType
    }

    private func buildBezierBubbleController(for bubbleView: BezierMaskedView<some Any>, messageType: MessageType, bubbleType: Cell.BubbleType) {
        UIView.performWithoutAnimation {
            bubbleView.backgroundColor = messageType.isIncoming ? configuration.colors.incomingBubble : configuration.colors.outgoingBubble
            bubbleView.customView.layoutMargins = .zero
        }

        bubbleView.bubbleCornerRadius = configuration.layout.bubbleCornerRadius
        bubbleView.messageType = messageType
        bubbleView.bubbleType = bubbleType
    }

    private func resolveBubbleType(_ bubbleType: Cell.BubbleType) -> Cell.BubbleType {
        configuration.behavior.showsBubbleTail ? bubbleType : .normal
    }

}

extension DefaultChatCollectionDataSource: UICollectionViewDataSource {
    func numberOfSections(in collectionView: UICollectionView) -> Int {
        sections.count
    }

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        sections[section].cells.count
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = sections[indexPath.section].cells[indexPath.item]
        switch cell {
        case let .message(message, bubbleType: bubbleType):
            if let provider = configuration.customCellProvider,
               let customCell = provider(message, collectionView, indexPath) {
                return customCell
            }
            switch message.data {
            case let .text(text):
                let cell = createTextCell(collectionView: collectionView, messageId: message.id, indexPath: indexPath, text: text, date: message.date, alignment: cell.alignment, user: message.owner, bubbleType: bubbleType, status: message.status, messageType: message.type, showName: message.showsHeader, replyPreview: message.replyPreview)
                return cell
            case let .image(source, isLocallyStored: _):
                let cell = createImageCell(collectionView: collectionView, messageId: message.id, indexPath: indexPath, alignment: cell.alignment, user: message.owner, source: source, date: message.date, bubbleType: bubbleType, status: message.status, messageType: message.type, showName: message.showsHeader, replyPreview: message.replyPreview)
                return cell
            case .custom:
                if case let .custom(custom) = message.data {
                    return createCustomCell(collectionView: collectionView, messageId: message.id, indexPath: indexPath, alignment: cell.alignment, user: message.owner, custom: custom, date: message.date, bubbleType: bubbleType, status: message.status, messageType: message.type, showName: message.showsHeader, replyPreview: message.replyPreview)
                }
                return createTextCell(collectionView: collectionView, messageId: message.id, indexPath: indexPath, text: configuration.behavior.unsupportedMessageText, date: message.date, alignment: cell.alignment, user: message.owner, bubbleType: bubbleType, status: message.status, messageType: message.type, showName: message.showsHeader, replyPreview: message.replyPreview)
            }
        case let .date(group):
            let cell = createDateTitle(collectionView: collectionView, indexPath: indexPath, alignment: cell.alignment, title: group.title)
            return cell
        case let .system(message):
            return createSystemMessageCell(collectionView: collectionView, indexPath: indexPath, message: message)
        }
    }
}

extension DefaultChatCollectionDataSource: ChatLayoutDelegate {
    func pinningTypeForItem(
        _ chatLayout: CollectionViewChatLayout,
        at indexPath: IndexPath
    ) -> ChatItemPinningType? {
        let cell = sections[indexPath.section].cells[indexPath.item]
        guard case .date = cell else {
            return nil
        }
        return .top
    }

    func sizeForItem(_ chatLayout: CollectionViewChatLayout, at indexPath: IndexPath) -> ItemSize {
        let item = sections[indexPath.section].cells[indexPath.item]
        switch item {
        case let .message(message, bubbleType: _):
            switch message.data {
// Uncomment to test exact sizes
//                case let .text(text):
//                    let rect = (text as NSString).boundingRect(with: .init(width: chatLayout.layoutFrame.width * Constants.maxWidth, height: CGFloat.greatestFiniteMagnitude),options: [NSStringDrawingOptions.usesLineFragmentOrigin, NSStringDrawingOptions.usesFontLeading] , attributes: [.font: UIFont.preferredFont(forTextStyle: .body)], context: nil)
//                    return .exact(CGSize(width: chatLayout.layoutFrame.width, height: rect.height + 16))

            case .text:
                return .estimated(CGSize(width: chatLayout.layoutFrame.width, height: 80))
            case .image:
                return .estimated(CGSize(width: chatLayout.layoutFrame.width, height: 160))
            case .custom:
                return .estimated(CGSize(width: chatLayout.layoutFrame.width, height: 80))
            }
        case .system:
            return .estimated(CGSize(width: chatLayout.layoutFrame.width, height: 32))
        case .date:
            return .estimated(CGSize(width: chatLayout.layoutFrame.width, height: 22))
        }
    }

    func alignmentForItem(_ chatLayout: CollectionViewChatLayout, at indexPath: IndexPath) -> ChatItemAlignment {
        let item = sections[indexPath.section].cells[indexPath.item]
        switch item {
        case .date:
            return .center
        case .message:
            return .fullWidth
        case .system:
            return .center
        }
    }

    func initialLayoutAttributesForInsertedItem(_ chatLayout: CollectionViewChatLayout, at indexPath: IndexPath, modifying originalAttributes: ChatLayoutAttributes, on state: InitialAttributesRequestType) {
        originalAttributes.alpha = 0

    }

    func finalLayoutAttributesForDeletedItem(_ chatLayout: CollectionViewChatLayout, at indexPath: IndexPath, modifying originalAttributes: ChatLayoutAttributes) {
        originalAttributes.alpha = 0

    }

    func interItemSpacing(_ chatLayout: CollectionViewChatLayout, after indexPath: IndexPath) -> CGFloat? {
        let item = sections[indexPath.section].cells[indexPath.item]
        switch item {
        default:
            return nil
        }
    }

    func interSectionSpacing(_ chatLayout: CollectionViewChatLayout, after sectionIndex: Int) -> CGFloat? {
        configuration.layout.interSectionSpacing
    }
}

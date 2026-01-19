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

typealias TextMessageCollectionCell = ContainerCollectionViewCell<MessageContainerView<MainContainerView<AvatarView, TextMessageView, StatusView>>>
typealias URLCollectionCell = ContainerCollectionViewCell<MessageContainerView<MainContainerView<AvatarView, URLView, StatusView>>>
typealias ImageCollectionCell = ContainerCollectionViewCell<MessageContainerView<MainContainerView<AvatarView, ImageView, StatusView>>>
typealias TitleCollectionCell = ContainerCollectionViewCell<UILabel>
typealias DateSeparatorCollectionCell = ContainerCollectionViewCell<DateSeparatorView>
typealias UserTitleCollectionCell = ContainerCollectionViewCell<SwappingContainerView<EdgeAligningView<UILabel>, UIImageView>>
typealias TypingIndicatorCollectionCell = ContainerCollectionViewCell<MessageContainerView<MainContainerView<AvatarPlaceholderView, TextMessageView, VoidViewFactory>>>

final class DefaultChatCollectionDataSource: NSObject, ChatCollectionDataSource {
    var onReloadMessage: ((UUID) -> Void)?

    var sections: [Section] = [] {
        didSet {
            oldSections = oldValue
        }
    }

    private var oldSections: [Section] = []

    func prepare(with collectionView: UICollectionView) {
        collectionView.register(TextMessageCollectionCell.self, forCellWithReuseIdentifier: TextMessageCollectionCell.reuseIdentifier)
        collectionView.register(ImageCollectionCell.self, forCellWithReuseIdentifier: ImageCollectionCell.reuseIdentifier)
        collectionView.register(TitleCollectionCell.self, forCellWithReuseIdentifier: TitleCollectionCell.reuseIdentifier)
        collectionView.register(UserTitleCollectionCell.self, forCellWithReuseIdentifier: UserTitleCollectionCell.reuseIdentifier)
        collectionView.register(DateSeparatorCollectionCell.self, forCellWithReuseIdentifier: DateSeparatorCollectionCell.reuseIdentifier)
        collectionView.register(TypingIndicatorCollectionCell.self, forCellWithReuseIdentifier: TypingIndicatorCollectionCell.reuseIdentifier)
        collectionView.register(URLCollectionCell.self, forCellWithReuseIdentifier: URLCollectionCell.reuseIdentifier)
    }

    private func createTextCell(collectionView: UICollectionView, messageId: UUID, indexPath: IndexPath, text: String, date: Date, alignment: ChatItemAlignment, user: User, bubbleType: Cell.BubbleType, status: MessageStatus, messageType: MessageType) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: TextMessageCollectionCell.reuseIdentifier, for: indexPath) as! TextMessageCollectionCell
        setupMessageContainerView(cell.customView, messageId: messageId, alignment: alignment)
        setupMainMessageView(cell.customView.customView, user: user, alignment: alignment, bubble: bubbleType, status: status)

        let bubbleView = cell.customView.customView.customView
        let controller = TextMessageController(
            text: text,
            type: messageType
        )

        buildTextBubbleController(bubbleView: bubbleView, messageType: messageType, bubbleType: bubbleType)

        bubbleView.customView.setup(with: controller)
        controller.view = bubbleView.customView
        cell.delegate = bubbleView.customView

        return cell
    }

    private func createURLCell(collectionView: UICollectionView, messageId: UUID, indexPath: IndexPath, url: URL, date: Date, alignment: ChatItemAlignment, user: User, bubbleType: Cell.BubbleType, status: MessageStatus, messageType: MessageType) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: URLCollectionCell.reuseIdentifier, for: indexPath) as! URLCollectionCell
        setupMessageContainerView(cell.customView, messageId: messageId, alignment: alignment)
        setupMainMessageView(cell.customView.customView, user: user, alignment: alignment, bubble: bubbleType, status: status)

        let bubbleView = cell.customView.customView.customView
        let controller = URLController(
            url: url,
            messageId: messageId
        )

        buildBezierBubbleController(for: bubbleView, messageType: messageType, bubbleType: bubbleType)

        bubbleView.customView.setup(with: controller)
        controller.view = bubbleView.customView
        controller.onReload = { [weak self] id in
            self?.onReloadMessage?(id)
        }
        cell.delegate = bubbleView.customView

        return cell
    }

    private func createImageCell(collectionView: UICollectionView, messageId: UUID, indexPath: IndexPath, alignment: ChatItemAlignment, user: User, source: ImageMessageSource, date: Date, bubbleType: Cell.BubbleType, status: MessageStatus, messageType: MessageType) -> ImageCollectionCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: ImageCollectionCell.reuseIdentifier, for: indexPath) as! ImageCollectionCell

        setupMessageContainerView(cell.customView, messageId: messageId, alignment: alignment)
        setupMainMessageView(cell.customView.customView, user: user, alignment: alignment, bubble: bubbleType, status: status)

        let bubbleView = cell.customView.customView.customView
        let controller = ImageController(
            source: source,
            messageId: messageId
        )

        buildBezierBubbleController(for: bubbleView, messageType: messageType, bubbleType: bubbleType)

        controller.onReload = { [weak self] id in
            self?.onReloadMessage?(id)
        }
        bubbleView.customView.setup(with: controller)
        controller.view = bubbleView.customView
        cell.delegate = bubbleView.customView

        return cell
    }

    private func createTypingIndicatorCell(collectionView: UICollectionView, indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: TypingIndicatorCollectionCell.reuseIdentifier, for: indexPath) as! TypingIndicatorCollectionCell
        let alignment = ChatItemAlignment.leading
        cell.customView.alignment = alignment
        let bubbleView = cell.customView.customView.customView
        let controller = TextMessageController(
            text: "Typing...",
            type: .incoming
        )

        buildTextBubbleController(bubbleView: bubbleView, messageType: .incoming, bubbleType: .tailed)

        bubbleView.customView.setup(with: controller)
        controller.view = bubbleView.customView
        cell.delegate = bubbleView.customView

        return cell
    }

    private func createGroupTitle(collectionView: UICollectionView, indexPath: IndexPath, alignment: ChatItemAlignment, title: String) -> UserTitleCollectionCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: UserTitleCollectionCell.reuseIdentifier, for: indexPath) as! UserTitleCollectionCell
        cell.customView.spacing = 2

        cell.customView.customView.customView.text = title
        cell.customView.customView.customView.preferredMaxLayoutWidth = (collectionView.collectionViewLayout as? CollectionViewChatLayout)?.layoutFrame.width ?? collectionView.frame.width
        cell.customView.customView.customView.textColor = .gray
        cell.customView.customView.customView.numberOfLines = 0
        cell.customView.customView.customView.font = .preferredFont(forTextStyle: .caption2)
        cell.customView.customView.flexibleEdges = [.top]

        cell.contentView.layoutMargins = UIEdgeInsets(top: 2, left: 40, bottom: 2, right: 40)
        return cell
    }

    private func createDateTitle(collectionView: UICollectionView, indexPath: IndexPath, alignment: ChatItemAlignment, title: String) -> DateSeparatorCollectionCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: DateSeparatorCollectionCell.reuseIdentifier, for: indexPath) as! DateSeparatorCollectionCell
        cell.customView.labelView.preferredMaxLayoutWidth = (collectionView.collectionViewLayout as? CollectionViewChatLayout)?.layoutFrame.width ?? collectionView.frame.width
        cell.customView.labelView.text = title
        cell.contentView.layoutMargins = UIEdgeInsets(top: 2, left: 0, bottom: 2, right: 0)
        return cell
    }

    private func setupMessageContainerView(_ messageContainerView: MessageContainerView<some Any>, messageId: UUID, alignment: ChatItemAlignment) {
        messageContainerView.alignment = alignment
    }

    private func setupMainMessageView(
        _ cellView: MainContainerView<AvatarView, some Any, StatusView>,
        user: User,
        alignment: ChatItemAlignment,
        bubble: Cell.BubbleType,
        status: MessageStatus
    ) {
        cellView.containerView.alignment = .bottom
        cellView.containerView.leadingView?.alpha = alignment.isIncoming ? 1 : 0
        cellView.containerView.trailingView?.alpha = alignment.isIncoming ? 0 : 1
        cellView.containerView.trailingView?.setup(with: status)
        if let avatarView = cellView.containerView.leadingView {
            let avatarViewController = AvatarViewController(user: user, bubble: bubble)
            avatarView.setup(with: avatarViewController)
            avatarViewController.view = avatarView
            if let avatarDelegate = cellView.customView.customView as? AvatarViewDelegate {
                avatarView.delegate = avatarDelegate
            } else {
                avatarView.delegate = nil
            }
        }
    }

    private func buildTextBubbleController(bubbleView: BezierMaskedView<some Any>, messageType: MessageType, bubbleType: Cell.BubbleType) {
        UIView.performWithoutAnimation {
            let marginOffset: CGFloat = messageType.isIncoming ? -Constants.tailSize : Constants.tailSize
            let edgeInsets = UIEdgeInsets(top: 8, left: 16 - marginOffset, bottom: 8, right: 16 + marginOffset)
            bubbleView.layoutMargins = edgeInsets
            bubbleView.backgroundColor = messageType.isIncoming ? .systemGray5 : .systemBlue
        }

        bubbleView.messageType = messageType
        bubbleView.bubbleType = bubbleType
    }

    private func buildBezierBubbleController(for bubbleView: BezierMaskedView<some Any>, messageType: MessageType, bubbleType: Cell.BubbleType) {
        UIView.performWithoutAnimation {
            bubbleView.backgroundColor = .clear
            bubbleView.customView.layoutMargins = .zero
        }


        bubbleView.messageType = messageType
        bubbleView.bubbleType = bubbleType
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
            switch message.data {
            case let .text(text):
                let cell = createTextCell(collectionView: collectionView, messageId: message.id, indexPath: indexPath, text: text, date: message.date, alignment: cell.alignment, user: message.owner, bubbleType: bubbleType, status: message.status, messageType: message.type)
                return cell
            case let .url(url, isLocallyStored: _):
                return createURLCell(collectionView: collectionView, messageId: message.id, indexPath: indexPath, url: url, date: message.date, alignment: cell.alignment, user: message.owner, bubbleType: bubbleType, status: message.status, messageType: message.type)
            case let .image(source, isLocallyStored: _):
                let cell = createImageCell(collectionView: collectionView, messageId: message.id, indexPath: indexPath, alignment: cell.alignment, user: message.owner, source: source, date: message.date, bubbleType: bubbleType, status: message.status, messageType: message.type)
                return cell
            }
        case let .messageGroup(group):
            let cell = createGroupTitle(collectionView: collectionView, indexPath: indexPath, alignment: cell.alignment, title: group.title)
            return cell
        case let .date(group):
            let cell = createDateTitle(collectionView: collectionView, indexPath: indexPath, alignment: cell.alignment, title: group.value)
            return cell
        case .typingIndicator:
            return createTypingIndicatorCell(collectionView: collectionView, indexPath: indexPath)
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
                return .estimated(CGSize(width: chatLayout.layoutFrame.width, height: 36))
            case let .image(_, isLocallyStored: isDownloaded):
                return .estimated(CGSize(width: chatLayout.layoutFrame.width, height: isDownloaded ? 120 : 80))
            case let .url(_, isLocallyStored: isDownloaded):
                return .estimated(CGSize(width: chatLayout.layoutFrame.width, height: isDownloaded ? 60 : 36))
            }
        case .date:
            return .estimated(CGSize(width: chatLayout.layoutFrame.width, height: 18))
        case .typingIndicator:
            return .estimated(CGSize(width: 60, height: 36))
        case .messageGroup:
            return .estimated(CGSize(width: min(85, chatLayout.layoutFrame.width / 3), height: 18))
        }
    }

    func alignmentForItem(_ chatLayout: CollectionViewChatLayout, at indexPath: IndexPath) -> ChatItemAlignment {
        let item = sections[indexPath.section].cells[indexPath.item]
        switch item {
        case .date:
            return .center
        case .message:
            return .fullWidth
        case .messageGroup,
             .typingIndicator:
            return .leading
        }
    }

    func initialLayoutAttributesForInsertedItem(_ chatLayout: CollectionViewChatLayout, at indexPath: IndexPath, modifying originalAttributes: ChatLayoutAttributes, on state: InitialAttributesRequestType) {
        originalAttributes.alpha = 0

        switch sections[indexPath.section].cells[indexPath.item] {
        // Uncomment to see the effect
//        case .messageGroup:
//            originalAttributes.center.x -= originalAttributes.frame.width
//        case let .message(message, bubbleType: _):
//            originalAttributes.transform = .init(scaleX: 0.9, y: 0.9)
//            originalAttributes.transform = originalAttributes.transform.concatenating(.init(rotationAngle: message.type == .incoming ? -0.05 : 0.05))
//            originalAttributes.center.x += (message.type == .incoming ? -20 : 20)
        case .typingIndicator:
            originalAttributes.transform = .init(scaleX: 0.1, y: 0.1)
            originalAttributes.center.x -= originalAttributes.bounds.width / 5
        default:
            break
        }
    }

    func finalLayoutAttributesForDeletedItem(_ chatLayout: CollectionViewChatLayout, at indexPath: IndexPath, modifying originalAttributes: ChatLayoutAttributes) {
        originalAttributes.alpha = 0

        switch oldSections[indexPath.section].cells[indexPath.item] {
        // Uncomment to see the effect
//        case .messageGroup:
//            originalAttributes.center.x -= originalAttributes.frame.width
//        case let .message(message, bubbleType: _):
//            originalAttributes.transform = .init(scaleX: 0.9, y: 0.9)
//            originalAttributes.transform = originalAttributes.transform.concatenating(.init(rotationAngle: message.type == .incoming ? -0.05 : 0.05))
//            originalAttributes.center.x += (message.type == .incoming ? -20 : 20)
        case .typingIndicator:
            originalAttributes.transform = .init(scaleX: 0.1, y: 0.1)
            originalAttributes.center.x -= originalAttributes.bounds.width / 5
        default:
            break
        }
    }

    func interItemSpacing(_ chatLayout: CollectionViewChatLayout, after indexPath: IndexPath) -> CGFloat? {
        let item = sections[indexPath.section].cells[indexPath.item]
        switch item {
        case .messageGroup:
            return 3
        default:
            return nil
        }
    }

    func interSectionSpacing(_ chatLayout: CollectionViewChatLayout, after sectionIndex: Int) -> CGFloat? {
        50
    }
}

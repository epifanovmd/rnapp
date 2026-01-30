//
// MessageBodyView.swift
// chat-ios
//
// Created by Andrei on 17.01.2026.
//

import Foundation
import UIKit

final class MessageBodyView<ContentView: UIView>: UIView, UIGestureRecognizerDelegate {
    enum LayoutStyle {
        case stacked
        case overlay
    }

    private let stackView = UIStackView()
    private let nameLabel = UILabel()
    private let replyWrapper = UIView()
    private let replyContainer = UIView()
    private let replyIndicator = UIView()
    private let replyContentStack = UIStackView()
    private let replySenderLabel = UILabel()
    private let replyContentContainer = UIView()
    private let replyContentView = ReplyPreviewContentView()
    private var replyContentLeadingConstraint: NSLayoutConstraint?
    private var replyContentConstraints: [NSLayoutConstraint] = []
    private var replyContainerConstraints: [NSLayoutConstraint] = []
    private let footerContainer = UIView()
    private let footerStack = UIStackView()
    private let timeLabel = UILabel()
    private let statusImageView = UIImageView()
    private let overlayContainer = UIView()
    private let overlayNameBackgroundView = UIView()
    private let overlayFooterBackgroundView = UIView()
    private let overlayNameContainer = UIView()
    private let overlayFooterContainer = UIView()
    let contentView: ContentView = ContentView()
    private let contentContainer = UIView()
    private var layoutStyle: LayoutStyle = .stacked
    private var overlayConstraints: [NSLayoutConstraint] = []
    private var replyId: UUID?
    var onReplyTap: ((UUID) -> Void)?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    func applyMeta(
        name: String,
        status: MessageStatus,
        configuration: ChatConfiguration,
        isIncoming: Bool,
        date: Date,
        layoutStyle: LayoutStyle,
        showName: Bool
    ) {
        if self.layoutStyle != layoutStyle {
            self.layoutStyle = layoutStyle
            configureLayoutStyle(layoutStyle)
        }

        nameLabel.text = name
        let shouldShowName: Bool
        switch configuration.behavior.nameDisplayMode {
        case .always:
            shouldShowName = true
        case .first:
            shouldShowName = showName
        case .none:
            shouldShowName = false
        }
        nameLabel.isHidden = !shouldShowName
        nameLabel.textColor = configuration.colors.messageSenderText
        nameLabel.font = configuration.fonts.messageSender

        timeLabel.text = configuration.dateFormatting.messageTimeProvider(date)
        timeLabel.font = configuration.fonts.messageTime
        timeLabel.textColor = configuration.colors.messageTimeText
        timeLabel.textAlignment = .right
        let isOutgoing = !isIncoming
        footerContainer.isHidden = !configuration.behavior.showsMessageTime && !(configuration.behavior.showsStatus && isOutgoing)
        timeLabel.isHidden = !configuration.behavior.showsMessageTime
        statusImageView.isHidden = !(configuration.behavior.showsStatus && isOutgoing)
        overlayNameContainer.isHidden = layoutStyle != .overlay || nameLabel.isHidden
        overlayFooterContainer.isHidden = layoutStyle != .overlay || footerContainer.isHidden

        statusImageView.image = statusIcon(for: status, configuration: configuration)
        statusImageView.tintColor = statusColor(for: status, configuration: configuration)

        overlayNameBackgroundView.backgroundColor = configuration.colors.mediaOverlayBackground
        overlayFooterBackgroundView.backgroundColor = configuration.colors.mediaOverlayBackground
        if layoutStyle == .overlay {
            let marginOffset: CGFloat = isIncoming ? -configuration.layout.tailSize : configuration.layout.tailSize
            let insets = configuration.layout.bubbleContentInsets
            contentContainer.layoutMargins = UIEdgeInsets(
                top: insets.top,
                left: insets.left - marginOffset,
                bottom: insets.bottom,
                right: insets.right + marginOffset
            )
        } else {
            contentContainer.layoutMargins = .zero
        }
    }

    func applyReply(preview: ReplyPreview?, configuration: ChatConfiguration, isIncoming: Bool) {
        guard configuration.behavior.showsReplyPreview,
              let preview,
              preview.data.isSystem == false else {
            replyContainer.isHidden = true
            replyWrapper.isHidden = true
            replyId = nil
            return
        }
        replyId = preview.id
        replyWrapper.isHidden = false
        replyContainer.isHidden = false
        NSLayoutConstraint.activate(replyContainerConstraints)
        let insets = configuration.layout.replyPreviewInsets
        replyContainer.backgroundColor = configuration.colors.replyPreviewBackground
        replyContainer.layer.borderWidth = 0
        replyContainer.layer.cornerRadius = 8
        replyContainer.clipsToBounds = true
        replyContainer.layoutMargins = UIEdgeInsets(top: insets.top, left: 0, bottom: insets.bottom, right: insets.right)
        replyContentLeadingConstraint?.constant = insets.left

        let shouldShowReplySender: Bool
        switch configuration.behavior.nameDisplayMode {
        case .none:
            shouldShowReplySender = false
        case .always, .first:
            shouldShowReplySender = true
        }
        replySenderLabel.isHidden = !shouldShowReplySender
        replySenderLabel.text = preview.senderName
        replySenderLabel.font = configuration.fonts.messageSender
        replySenderLabel.textColor = configuration.colors.replyPreviewSenderText

        replyIndicator.backgroundColor = configuration.colors.replyPreviewBorder
        replyIndicator.alpha = 0.7

        switch layoutStyle {
        case .overlay:
            replyWrapper.layoutMargins = configuration.layout.bubbleContentInsets
        case .stacked:
            replyWrapper.layoutMargins = .zero
        }
        activateReplyContainerConstraints()
        replyContentView.apply(preview: preview, configuration: configuration, isIncoming: isIncoming)
    }

    private func setupView() {
        translatesAutoresizingMaskIntoConstraints = false
        insetsLayoutMarginsFromSafeArea = false
        layoutMargins = .zero

        addSubview(stackView)
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.axis = .vertical
        stackView.alignment = .fill
        stackView.spacing = 4

        nameLabel.numberOfLines = 1
        timeLabel.numberOfLines = 1
        statusImageView.contentMode = .scaleAspectFit

        stackView.addArrangedSubview(nameLabel)
        stackView.addArrangedSubview(replyWrapper)
        stackView.addArrangedSubview(contentContainer)
        stackView.addArrangedSubview(footerContainer)

        NSLayoutConstraint.activate([
            stackView.topAnchor.constraint(equalTo: layoutMarginsGuide.topAnchor),
            stackView.bottomAnchor.constraint(equalTo: layoutMarginsGuide.bottomAnchor),
            stackView.leadingAnchor.constraint(equalTo: layoutMarginsGuide.leadingAnchor),
            stackView.trailingAnchor.constraint(equalTo: layoutMarginsGuide.trailingAnchor)
        ])

        replyWrapper.translatesAutoresizingMaskIntoConstraints = false
        replyWrapper.insetsLayoutMarginsFromSafeArea = false
        replyWrapper.isHidden = true
        replyWrapper.addSubview(replyContainer)

        replyContainer.translatesAutoresizingMaskIntoConstraints = false
        replyContainer.insetsLayoutMarginsFromSafeArea = false
        replyContainer.isHidden = true
        replyIndicator.translatesAutoresizingMaskIntoConstraints = false
        replyIndicator.clipsToBounds = true
        replyIndicator.layer.cornerRadius = 1.5

        replyContentStack.axis = .vertical
        replyContentStack.alignment = .leading
        replyContentStack.spacing = 2
        replyContentStack.translatesAutoresizingMaskIntoConstraints = false

        replySenderLabel.numberOfLines = 1

        replyContainer.addSubview(replyIndicator)
        replyContainer.addSubview(replyContentStack)
        replyContentStack.addArrangedSubview(replySenderLabel)
        replyContentStack.addArrangedSubview(replyContentContainer)

        replyContentLeadingConstraint = replyContentStack.leadingAnchor.constraint(equalTo: replyIndicator.trailingAnchor, constant: 6)

        replyContainerConstraints = [
            replyContainer.topAnchor.constraint(equalTo: replyWrapper.layoutMarginsGuide.topAnchor),
            replyContainer.bottomAnchor.constraint(equalTo: replyWrapper.layoutMarginsGuide.bottomAnchor),
            replyContainer.leadingAnchor.constraint(equalTo: replyWrapper.layoutMarginsGuide.leadingAnchor),
            replyContainer.trailingAnchor.constraint(equalTo: replyWrapper.layoutMarginsGuide.trailingAnchor),
            replyIndicator.leadingAnchor.constraint(equalTo: replyContainer.leadingAnchor),
            replyIndicator.topAnchor.constraint(equalTo: replyContainer.topAnchor),
            replyIndicator.bottomAnchor.constraint(equalTo: replyContainer.bottomAnchor),
            replyIndicator.widthAnchor.constraint(equalToConstant: 3),
            replyContentStack.topAnchor.constraint(equalTo: replyContainer.layoutMarginsGuide.topAnchor),
            replyContentStack.bottomAnchor.constraint(equalTo: replyContainer.layoutMarginsGuide.bottomAnchor),
            replyContentLeadingConstraint!,
            replyContentStack.trailingAnchor.constraint(equalTo: replyContainer.layoutMarginsGuide.trailingAnchor)
        ]
        NSLayoutConstraint.activate(replyContainerConstraints)

        replyContentContainer.translatesAutoresizingMaskIntoConstraints = false
        replyContentContainer.setContentHuggingPriority(.required, for: .horizontal)
        replyContentContainer.setContentCompressionResistancePriority(.required, for: .horizontal)
        replyContentContainer.addSubview(replyContentView)
        replyContentView.translatesAutoresizingMaskIntoConstraints = false
        replyContentConstraints = [
            replyContentView.topAnchor.constraint(equalTo: replyContentContainer.topAnchor),
            replyContentView.bottomAnchor.constraint(equalTo: replyContentContainer.bottomAnchor),
            replyContentView.leadingAnchor.constraint(equalTo: replyContentContainer.leadingAnchor),
            replyContentView.trailingAnchor.constraint(equalTo: replyContentContainer.trailingAnchor)
        ]
        NSLayoutConstraint.activate(replyContentConstraints)

        let replyTap = UITapGestureRecognizer(target: self, action: #selector(handleReplyTap))
        replyTap.cancelsTouchesInView = false
        replyTap.delaysTouchesBegan = false
        replyTap.delaysTouchesEnded = false
        replyTap.delegate = self
        replyWrapper.addGestureRecognizer(replyTap)

        contentContainer.translatesAutoresizingMaskIntoConstraints = false
        contentContainer.insetsLayoutMarginsFromSafeArea = false
        contentContainer.addSubview(contentView)
        contentView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            contentView.topAnchor.constraint(equalTo: contentContainer.topAnchor),
            contentView.bottomAnchor.constraint(equalTo: contentContainer.bottomAnchor),
            contentView.leadingAnchor.constraint(equalTo: contentContainer.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: contentContainer.trailingAnchor)
        ])

        footerContainer.translatesAutoresizingMaskIntoConstraints = false
        footerContainer.addSubview(footerStack)
        footerStack.translatesAutoresizingMaskIntoConstraints = false
        footerStack.axis = .horizontal
        footerStack.spacing = 4
        footerStack.alignment = .center

        footerStack.addArrangedSubview(timeLabel)
        footerStack.addArrangedSubview(statusImageView)

        NSLayoutConstraint.activate([
            footerStack.topAnchor.constraint(equalTo: footerContainer.topAnchor),
            footerStack.bottomAnchor.constraint(equalTo: footerContainer.bottomAnchor),
            footerStack.trailingAnchor.constraint(equalTo: footerContainer.trailingAnchor),
            footerStack.leadingAnchor.constraint(greaterThanOrEqualTo: footerContainer.leadingAnchor)
        ])

        let iconSize: CGFloat = 12
        statusImageView.widthAnchor.constraint(equalToConstant: iconSize).isActive = true
        statusImageView.heightAnchor.constraint(equalToConstant: iconSize).isActive = true

        overlayContainer.translatesAutoresizingMaskIntoConstraints = false
        overlayContainer.addSubview(overlayNameContainer)
        overlayContainer.addSubview(overlayFooterContainer)
            overlayNameContainer.translatesAutoresizingMaskIntoConstraints = false
            overlayFooterContainer.translatesAutoresizingMaskIntoConstraints = false
            overlayNameContainer.setContentHuggingPriority(.required, for: .horizontal)
            overlayNameContainer.setContentCompressionResistancePriority(.required, for: .horizontal)
            overlayFooterContainer.setContentHuggingPriority(.required, for: .horizontal)
            overlayFooterContainer.setContentCompressionResistancePriority(.required, for: .horizontal)

            overlayNameContainer.addSubview(overlayNameBackgroundView)
            overlayNameContainer.addSubview(nameLabel)
            overlayFooterContainer.addSubview(overlayFooterBackgroundView)
            overlayFooterContainer.addSubview(footerContainer)

            overlayNameBackgroundView.translatesAutoresizingMaskIntoConstraints = false
            overlayFooterBackgroundView.translatesAutoresizingMaskIntoConstraints = false
        overlayNameBackgroundView.layer.cornerRadius = 8
        overlayFooterBackgroundView.layer.cornerRadius = 8
        overlayNameBackgroundView.clipsToBounds = true
        overlayFooterBackgroundView.clipsToBounds = true

        configureLayoutStyle(.stacked)
    }

    private func statusColor(for status: MessageStatus, configuration: ChatConfiguration) -> UIColor {
        switch status {
        case .sent:
            return configuration.colors.statusSent
        case .received:
            return configuration.colors.statusReceived
        case .read:
            return configuration.colors.statusRead
        }
    }

    private func statusIcon(for status: MessageStatus, configuration: ChatConfiguration) -> UIImage? {
        switch status {
        case .sent:
            return configuration.statusIcons.sent
        case .received:
            return configuration.statusIcons.sent
        case .read:
            return configuration.statusIcons.read
        }
    }

    private func configureLayoutStyle(_ style: LayoutStyle) {
        switch style {
        case .stacked:
            NSLayoutConstraint.deactivate(overlayConstraints)
            overlayConstraints.removeAll()
            overlayContainer.removeFromSuperview()
            overlayContainer.subviews.forEach { $0.removeFromSuperview() }
            if stackView.arrangedSubviews.contains(contentContainer) == false {
                stackView.addArrangedSubview(contentContainer)
            }
            if stackView.arrangedSubviews.contains(nameLabel) == false {
                stackView.insertArrangedSubview(nameLabel, at: 0)
            }
            if stackView.arrangedSubviews.contains(replyWrapper) == false {
                stackView.insertArrangedSubview(replyWrapper, at: 1)
            }
            if stackView.arrangedSubviews.contains(footerContainer) == false {
                stackView.addArrangedSubview(footerContainer)
            }
        case .overlay:
            nameLabel.removeFromSuperview()
            footerContainer.removeFromSuperview()
            if stackView.arrangedSubviews.contains(contentContainer) == false {
                stackView.addArrangedSubview(contentContainer)
            }
            if stackView.arrangedSubviews.contains(replyWrapper) == false {
                stackView.insertArrangedSubview(replyWrapper, at: 0)
            }
            if overlayContainer.superview !== contentContainer {
                contentContainer.addSubview(overlayContainer)
            }
            if overlayNameContainer.superview !== overlayContainer {
                overlayContainer.addSubview(overlayNameContainer)
            }
            if overlayFooterContainer.superview !== overlayContainer {
                overlayContainer.addSubview(overlayFooterContainer)
            }
            if overlayNameBackgroundView.superview !== overlayNameContainer {
                overlayNameContainer.addSubview(overlayNameBackgroundView)
            }
            if nameLabel.superview !== overlayNameContainer {
                overlayNameContainer.addSubview(nameLabel)
            }
            if overlayFooterBackgroundView.superview !== overlayFooterContainer {
                overlayFooterContainer.addSubview(overlayFooterBackgroundView)
            }
            if footerContainer.superview !== overlayFooterContainer {
                overlayFooterContainer.addSubview(footerContainer)
            }
            NSLayoutConstraint.deactivate(overlayConstraints)
            overlayConstraints = [
                overlayContainer.leadingAnchor.constraint(equalTo: contentContainer.layoutMarginsGuide.leadingAnchor),
                overlayContainer.trailingAnchor.constraint(equalTo: contentContainer.layoutMarginsGuide.trailingAnchor),
                overlayContainer.topAnchor.constraint(equalTo: contentContainer.layoutMarginsGuide.topAnchor),
                overlayContainer.bottomAnchor.constraint(equalTo: contentContainer.layoutMarginsGuide.bottomAnchor),
                overlayNameContainer.leadingAnchor.constraint(equalTo: overlayContainer.leadingAnchor),
                overlayNameContainer.trailingAnchor.constraint(lessThanOrEqualTo: overlayContainer.trailingAnchor),
                overlayNameContainer.topAnchor.constraint(equalTo: overlayContainer.topAnchor),
                overlayNameContainer.widthAnchor.constraint(equalTo: nameLabel.widthAnchor, constant: 16),
                overlayFooterContainer.trailingAnchor.constraint(equalTo: overlayContainer.trailingAnchor),
                overlayFooterContainer.leadingAnchor.constraint(greaterThanOrEqualTo: overlayContainer.leadingAnchor),
                overlayFooterContainer.bottomAnchor.constraint(equalTo: overlayContainer.bottomAnchor),
                overlayFooterContainer.widthAnchor.constraint(equalTo: footerContainer.widthAnchor, constant: 16),
                overlayNameBackgroundView.leadingAnchor.constraint(equalTo: overlayNameContainer.leadingAnchor),
                overlayNameBackgroundView.trailingAnchor.constraint(equalTo: overlayNameContainer.trailingAnchor),
                overlayNameBackgroundView.topAnchor.constraint(equalTo: overlayNameContainer.topAnchor),
                overlayNameBackgroundView.bottomAnchor.constraint(equalTo: overlayNameContainer.bottomAnchor),
                overlayFooterBackgroundView.leadingAnchor.constraint(equalTo: overlayFooterContainer.leadingAnchor),
                overlayFooterBackgroundView.trailingAnchor.constraint(equalTo: overlayFooterContainer.trailingAnchor),
                overlayFooterBackgroundView.topAnchor.constraint(equalTo: overlayFooterContainer.topAnchor),
                overlayFooterBackgroundView.bottomAnchor.constraint(equalTo: overlayFooterContainer.bottomAnchor),
                nameLabel.topAnchor.constraint(equalTo: overlayNameContainer.topAnchor, constant: 4),
                nameLabel.leadingAnchor.constraint(equalTo: overlayNameContainer.leadingAnchor, constant: 8),
                nameLabel.trailingAnchor.constraint(equalTo: overlayNameContainer.trailingAnchor, constant: -8),
                nameLabel.bottomAnchor.constraint(equalTo: overlayNameContainer.bottomAnchor, constant: -4),
                footerContainer.topAnchor.constraint(equalTo: overlayFooterContainer.topAnchor, constant: 4),
                footerContainer.leadingAnchor.constraint(greaterThanOrEqualTo: overlayFooterContainer.leadingAnchor, constant: 8),
                footerContainer.trailingAnchor.constraint(equalTo: overlayFooterContainer.trailingAnchor, constant: -8),
                footerContainer.bottomAnchor.constraint(equalTo: overlayFooterContainer.bottomAnchor, constant: -4)
            ]
            NSLayoutConstraint.activate(overlayConstraints)
        }
    }

    @objc private func handleReplyTap() {
        guard let replyId else {
            return
        }
        onReplyTap?(replyId)
    }

    private func activateReplyContainerConstraints() {
        if replyContentView.superview !== replyContentContainer {
            replyContentView.removeFromSuperview()
            replyContentContainer.addSubview(replyContentView)
            replyContentView.translatesAutoresizingMaskIntoConstraints = false
        }
        if replyContentConstraints.isEmpty {
            replyContentConstraints = [
                replyContentView.topAnchor.constraint(equalTo: replyContentContainer.topAnchor),
                replyContentView.bottomAnchor.constraint(equalTo: replyContentContainer.bottomAnchor),
                replyContentView.leadingAnchor.constraint(equalTo: replyContentContainer.leadingAnchor),
                replyContentView.trailingAnchor.constraint(equalTo: replyContentContainer.trailingAnchor)
            ]
        }
        NSLayoutConstraint.activate(replyContentConstraints)
    }

    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
        otherGestureRecognizer is UIPanGestureRecognizer
    }

    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRequireFailureOf otherGestureRecognizer: UIGestureRecognizer) -> Bool {
        otherGestureRecognizer is UIPanGestureRecognizer
    }
}

private final class ReplyPreviewContentView: UIView {
    private var contentView: UIView?
    private var textController: TextMessageController?
    private var imageController: ImageController?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    func apply(preview: ReplyPreview, configuration: ChatConfiguration, isIncoming: Bool) {
        _ = isIncoming
        let newContentView = makeContentView(preview: preview, configuration: configuration, isIncoming: isIncoming)
        if let contentView {
            contentView.removeFromSuperview()
        }
        contentView = newContentView
        addSubview(newContentView)
        NSLayoutConstraint.activate([
            newContentView.topAnchor.constraint(equalTo: topAnchor),
            newContentView.bottomAnchor.constraint(equalTo: bottomAnchor),
            newContentView.leadingAnchor.constraint(equalTo: leadingAnchor),
            newContentView.trailingAnchor.constraint(equalTo: trailingAnchor)
        ])
        newContentView.isUserInteractionEnabled = false
    }

    private func setupView() {
        translatesAutoresizingMaskIntoConstraints = false
        insetsLayoutMarginsFromSafeArea = false
        layoutMargins = .zero
    }

    private func makeContentView(preview: ReplyPreview, configuration: ChatConfiguration, isIncoming: Bool) -> UIView {
        _ = isIncoming
        switch preview.data {
        case let .text(text):
            let view = TextMessageView()
            let controller = TextMessageController(text: text, type: preview.type, configuration: configuration)
            view.setup(with: controller)
            textController = controller
            view.translatesAutoresizingMaskIntoConstraints = false
            return view
        case let .image(source):
            let view = ImageView()
            let controller = ImageController(source: source, messageId: preview.id, configuration: configuration)
            view.setup(with: controller)
            controller.view = view
            imageController = controller
            view.translatesAutoresizingMaskIntoConstraints = false
            return view
        case let .system(text):
            let view = SystemMessageView()
            view.apply(text: text, configuration: configuration)
            view.layoutMargins = .zero
            view.translatesAutoresizingMaskIntoConstraints = false
            return view
        }
    }
}

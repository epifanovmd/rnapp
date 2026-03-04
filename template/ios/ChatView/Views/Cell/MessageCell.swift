// MARK: - MessageCell.swift
// Ячейка коллекции для одного сообщения.
// Управляет выравниванием пузыря (left/right) и точной шириной.
// Анимация подсветки при скролле к сообщению.

import UIKit

final class MessageCell: UICollectionViewCell {

    static let reuseID = "MessageCell"

    // MARK: - Subviews

    private let bubbleView = MessageBubbleView()

    // MARK: - Constraints

    private var leadingConstraint:     NSLayoutConstraint!
    private var trailingConstraint:    NSLayoutConstraint!
    private var bubbleWidthConstraint: NSLayoutConstraint!

    // MARK: - Stored message (нужен для makeBubblePreviewController)

    private var currentMessage:      ChatMessage?
    private var currentResolvedReply: ResolvedReply?
    private var currentTheme:        ChatTheme = .light

    // MARK: - Callbacks

    var onReplyTap: ((String) -> Void)?

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupLayout()
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Setup

    private func setupLayout() {
        bubbleView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(bubbleView)

        let top    = bubbleView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 2)
        let bottom = bubbleView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -2)
        bottom.priority = .init(999)

        let m = ChatLayoutConstants.cellSideMargin
        leadingConstraint  = bubbleView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: m)
        trailingConstraint = bubbleView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -m)

        bubbleWidthConstraint = bubbleView.widthAnchor.constraint(equalToConstant: 200)
        bubbleWidthConstraint.isActive = true

        NSLayoutConstraint.activate([top, bottom])
    }

    // MARK: - Configure

    func configure(
        with message: ChatMessage,
        resolvedReply: ResolvedReply?,
        collectionViewWidth: CGFloat,
        theme: ChatTheme
    ) {
        currentMessage       = message
        currentResolvedReply = resolvedReply
        currentTheme         = theme

        let maxBubble = floor(collectionViewWidth * ChatLayoutConstants.bubbleMaxWidthRatio)
        let hasReply  = resolvedReply.map { if case .found = $0 { return true }; return false } ?? false
        let exactBubbleW = MessageSizeCalculator.bubbleWidth(for: message, hasReply: hasReply, maxWidth: maxBubble)

        bubbleWidthConstraint.constant = exactBubbleW
        leadingConstraint.isActive     = !message.isMine
        trailingConstraint.isActive    = message.isMine

        bubbleView.configure(with: message, resolvedReply: resolvedReply, theme: theme)
        bubbleView.applyLayout(bubbleWidth: exactBubbleW)

        bubbleView.replyPreview.onTap = { [weak self] in
            guard let replyId = message.reply?.replyToId else { return }
            self?.onReplyTap?(replyId)
        }
    }

    // MARK: - Context menu: preview controller

    /// Строит UIViewController для previewProvider без отдельного класса.
    func makeBubblePreviewController() -> UIViewController? {
        guard let message = currentMessage else { return nil }

        let bubbleWidth = bubbleView.bounds.width
        let bubbleHeight = bubbleView.bounds.height

        let previewBubble = MessageBubbleView()
        previewBubble.configure(with: message, resolvedReply: currentResolvedReply, theme: currentTheme)
        previewBubble.applyLayout(bubbleWidth: bubbleWidth)
        previewBubble.translatesAutoresizingMaskIntoConstraints = false

        let vc = UIViewController()
        vc.view.backgroundColor = .clear
        vc.view.layer.cornerRadius = ChatLayoutConstants.bubbleCornerRadius
        vc.preferredContentSize = CGSize(width: bubbleWidth, height: bubbleHeight)
        vc.view.addSubview(previewBubble)

        NSLayoutConstraint.activate([
            previewBubble.topAnchor.constraint(equalTo: vc.view.topAnchor),
            previewBubble.bottomAnchor.constraint(equalTo: vc.view.bottomAnchor),
            previewBubble.leadingAnchor.constraint(equalTo: vc.view.leadingAnchor),
            previewBubble.trailingAnchor.constraint(equalTo: vc.view.trailingAnchor),
        ])

        return vc
    }

    // MARK: - Context menu: targeted preview

    /// Возвращает UITargetedPreview точно по контуру пузыря.
    func makeTargetedPreview() -> UITargetedPreview {
        let params = UIPreviewParameters()
  
        params.visiblePath = UIBezierPath(roundedRect: bubbleView.bounds, cornerRadius: ChatLayoutConstants.bubbleCornerRadius)
        params.backgroundColor = bubbleView.backgroundColor ?? .clear
      
        return UITargetedPreview(view: bubbleView, parameters: params)
    }

    // MARK: - Highlight

    func highlight(color: UIColor = UIColor.systemYellow.withAlphaComponent(0.55)) {
        let original = bubbleView.backgroundColor ?? .clear
        bubbleView.layer.removeAllAnimations()
        UIView.animate(withDuration: 0.25, delay: 0, options: .curveEaseIn) {
            self.bubbleView.backgroundColor = color
        } completion: { _ in
            UIView.animate(withDuration: 0.25, delay: 0.5,
                           options: [.curveEaseOut, .allowUserInteraction]) {
                self.bubbleView.backgroundColor = original
            }
        }
    }

    // MARK: - Reuse

    override func prepareForReuse() {
        super.prepareForReuse()
        bubbleView.layer.removeAllAnimations()
        onReplyTap           = nil
        currentMessage       = nil
        currentResolvedReply = nil
        leadingConstraint.isActive  = false
        trailingConstraint.isActive = false
    }
}

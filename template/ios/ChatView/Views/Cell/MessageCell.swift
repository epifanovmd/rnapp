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

    // MARK: - Callbacks

    /// Срабатывает при нажатии на блок цитаты внутри пузыря.
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
        leadingConstraint  = bubbleView.leadingAnchor.constraint(
            equalTo: contentView.leadingAnchor, constant: m)
        trailingConstraint = bubbleView.trailingAnchor.constraint(
            equalTo: contentView.trailingAnchor, constant: -m)

        bubbleWidthConstraint = bubbleView.widthAnchor.constraint(equalToConstant: 200)
        bubbleWidthConstraint.isActive = true

        NSLayoutConstraint.activate([top, bottom])
        // leading/trailing активируются в configure
    }

    // MARK: - Configure

    /// Заполняет ячейку данными, применяет тему и позиционирует пузырь.
    func configure(
        with message: ChatMessage,
        resolvedReply: ResolvedReply?,
        collectionViewWidth: CGFloat,
        theme: ChatTheme
    ) {
        let maxBubble = floor(collectionViewWidth * ChatLayoutConstants.bubbleMaxWidthRatio)
        let hasReply  = resolvedReply.map {
            if case .found = $0 { return true }; return false
        } ?? false
        let exactBubbleW = MessageSizeCalculator.bubbleWidth(
            for: message, hasReply: hasReply, maxWidth: maxBubble)

        bubbleWidthConstraint.constant  = exactBubbleW
        leadingConstraint.isActive      = !message.isMine
        trailingConstraint.isActive     = message.isMine

        bubbleView.configure(with: message, resolvedReply: resolvedReply, theme: theme)
        bubbleView.applyLayout(bubbleWidth: exactBubbleW)

        bubbleView.replyPreview.onTap = { [weak self] in
            guard let replyId = message.reply?.replyToId else { return }
            self?.onReplyTap?(replyId)
        }
    }

    // MARK: - Highlight
    // Продакшн-паттерн Telegram/WhatsApp: быстрое окрашивание → выдержка → возврат.

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
        onReplyTap = nil
        leadingConstraint.isActive  = false
        trailingConstraint.isActive = false
    }
}

// MARK: - MessageCell.swift

import UIKit

final class MessageCell: UICollectionViewCell {

    static let reuseID = "MessageCell"

    private let bubbleView = MessageBubbleView()

    private var leadingConstraint:     NSLayoutConstraint!
    private var trailingConstraint:    NSLayoutConstraint!
    private var bubbleWidthConstraint: NSLayoutConstraint!

    var onReplyTap: ((String) -> Void)?

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        bubbleView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(bubbleView)

        let top    = bubbleView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 2)
        let bottom = bubbleView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor,
                                                        constant: -2)
        bottom.priority = .init(999)

        let m = ChatLayoutConstants.cellSideMargin
        leadingConstraint  = bubbleView.leadingAnchor.constraint(
            equalTo: contentView.leadingAnchor, constant: m)
        trailingConstraint = bubbleView.trailingAnchor.constraint(
            equalTo: contentView.trailingAnchor, constant: -m)

        bubbleWidthConstraint = bubbleView.widthAnchor.constraint(equalToConstant: 200)
        bubbleWidthConstraint.isActive = true

        NSLayoutConstraint.activate([top, bottom])
        // leadingConstraint и trailingConstraint активируются в configure
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Configure

    func configure(with message: ChatMessage,
                   resolvedReply: ResolvedReply?,
                   collectionViewWidth: CGFloat) {
        let maxBubble    = floor(collectionViewWidth * ChatLayoutConstants.bubbleMaxWidthRatio)
        let hasReply     = resolvedReply.map { if case .found = $0 { return true }; return false }
                           ?? false
        let exactBubbleW = MessageSizeCalculator.bubbleWidth(for: message, hasReply: hasReply,
                                                             maxWidth: maxBubble)

        bubbleWidthConstraint.constant = exactBubbleW

        // Управляем стороной выравнивания: деактивируем обе, активируем нужную
        leadingConstraint.isActive  = !message.isMine
        trailingConstraint.isActive = message.isMine

        bubbleView.configure(with: message, resolvedReply: resolvedReply)
        bubbleView.applyLayout(bubbleWidth: exactBubbleW)

        bubbleView.replyPreview.onTap = { [weak self] in
            guard let replyId = message.reply?.replyToId else { return }
            self?.onReplyTap?(replyId)
        }
    }

    // MARK: - Highlight
    //
    // Паттерн Telegram/WhatsApp:
    //   Flash-in  0.15 с  — мгновенный визуальный якорь
    //   Hold      0.25 с  — глаз фиксирует куда попал
    //   Fade-out  1.10 с  — плавное исчезновение, не режет глаз

    func highlight(color: UIColor = UIColor.systemYellow.withAlphaComponent(0.55)) {
        let original = bubbleView.backgroundColor ?? .clear
        bubbleView.layer.removeAllAnimations()

        UIView.animate(withDuration: 0.25, delay: 0, options: .curveEaseIn) {
            self.bubbleView.backgroundColor = color
        } completion: { _ in
            UIView.animate(withDuration: 1, delay: 0, options: .curveLinear) {
                self.bubbleView.backgroundColor = color  // hold
            } completion: { _ in
                UIView.animate(withDuration: 0.25, delay: 0,
                               options: [.curveEaseOut, .allowUserInteraction]) {
                    self.bubbleView.backgroundColor = original
                } completion: { [weak self] _ in
                    self?.bubbleView.backgroundColor = original
                }
            }
        }
    }

    // MARK: - Reuse

    override func prepareForReuse() {
        super.prepareForReuse()
        bubbleView.layer.removeAllAnimations()
        onReplyTap = nil
        // Сбрасываем оба side-constraints — configure установит нужный
        leadingConstraint.isActive  = false
        trailingConstraint.isActive = false
    }
}

// MARK: - MessageCell.swift

import UIKit

final class MessageCell: UICollectionViewCell {

    static let reuseID = "MessageCell"

    let bubbleView = MessageBubbleView()

    private var leadingConstraint:     NSLayoutConstraint?
    private var trailingConstraint:    NSLayoutConstraint?
    private var bubbleWidthConstraint: NSLayoutConstraint?

    var onReplyTap: ((String) -> Void)?

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        bubbleView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(bubbleView)

        let top    = bubbleView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 2)
        let bottom = bubbleView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -2)
        bottom.priority = .init(999)

        NSLayoutConstraint.activate([top, bottom])

        let m = ChatLayoutConstants.cellSideMargin
        leadingConstraint  = bubbleView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: m)
        trailingConstraint = bubbleView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -m)
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Configure

    func configure(with message: ChatMessage,
                   resolvedReply: ResolvedReply?,
                   collectionViewWidth: CGFloat) {
        let maxBubble    = floor(collectionViewWidth * ChatLayoutConstants.bubbleMaxWidthRatio)
        let hasReply: Bool
        if case .found = resolvedReply { hasReply = true } else { hasReply = false }
        let exactBubbleW = MessageSizeCalculator.bubbleWidth(for: message, hasReply: hasReply, maxWidth: maxBubble)

        leadingConstraint?.isActive     = false
        trailingConstraint?.isActive    = false
        bubbleWidthConstraint?.isActive = false

        bubbleWidthConstraint = bubbleView.widthAnchor.constraint(equalToConstant: exactBubbleW)
        bubbleWidthConstraint?.isActive = true
        (message.isMine ? trailingConstraint : leadingConstraint)?.isActive = true

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
    //   flash-in  0.15 с  — мгновенный визуальный якорь
    //   hold      0.40 с  — глаз фиксирует сообщение (delay перед fade)
    //   fade-out  0.90 с  — плавное исчезновение
    //
    // Задержка реализована через delay: параметр третьей анимации,
    // а не через цепочку completion — это чище и надёжнее.
    //
    // Вызывается из ChatViewController.highlightMessage(id:) только когда
    // ячейка уже видима на экране (после проверки cellForItem != nil
    // или scrollViewDidEndScrollingAnimation).

    func highlight(color: UIColor = UIColor.systemYellow.withAlphaComponent(0.6)) {
        guard let original = bubbleView.bubbleColor else { return }
        bubbleView.layer.removeAllAnimations()

        // flash-in
        UIView.animate(withDuration: 0.15, delay: 0, options: .curveEaseIn) {
            self.bubbleView.backgroundColor = color
        } completion: { finished in
            guard finished else { return }
            // fade-out с задержкой hold
            UIView.animate(withDuration: 0.90, delay: 0.40,
                           options: [.curveEaseOut, .allowUserInteraction]) {
                self.bubbleView.backgroundColor = original
            } completion: { [weak self] _ in
                self?.bubbleView.backgroundColor = original
            }
        }
    }

    // MARK: - Reuse

    override func prepareForReuse() {
        super.prepareForReuse()
        bubbleView.layer.removeAllAnimations()
        bubbleView.cancelAsync()
        onReplyTap = nil
    }
}

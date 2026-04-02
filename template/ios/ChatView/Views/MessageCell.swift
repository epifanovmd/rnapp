import UIKit

final class MessageCell: UICollectionViewCell {

    // MARK: - Callbacks

    var onTap: (() -> Void)?
    var onLongPress: ((UICollectionViewCell) -> Void)?
    var onReplyTap: (() -> Void)?
    var onVideoTap: ((String) -> Void)?
    var onFileTap: ((String, String) -> Void)?
    var onPollOptionTap: ((String, String) -> Void)?
    var onPollDetailTap: ((String) -> Void)?
    var onVoiceTap: ((String) -> Void)?

    // MARK: - Views

    let bubbleView = MessageBubbleView()
    private var leadingConstraint: NSLayoutConstraint!
    private var trailingConstraint: NSLayoutConstraint!

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        backgroundColor = .clear
        contentView.backgroundColor = .clear

        bubbleView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(bubbleView)

        leadingConstraint = bubbleView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor,
                                                                 constant: ChatLayout.cellHMargin)
        trailingConstraint = bubbleView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor,
                                                                   constant: -ChatLayout.cellHMargin)

        NSLayoutConstraint.activate([
            bubbleView.topAnchor.constraint(equalTo: contentView.topAnchor),
            bubbleView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor),
        ])

        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        tap.cancelsTouchesInView = false
        bubbleView.addGestureRecognizer(tap)

        let longPress = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress))
        longPress.minimumPressDuration = 0.35
        bubbleView.addGestureRecognizer(longPress)
    }

    // MARK: - Configure

    func configure(message: ChatMessage, resolvedReply: ReplyDisplayInfo?, theme: ChatTheme, maxWidth: CGFloat) {
        let bw = MessageSizeCalculator.bubbleWidth(for: message, containerWidth: maxWidth)

        leadingConstraint.isActive = false
        trailingConstraint.isActive = false

        if message.isMine {
            trailingConstraint.isActive = true
            leadingConstraint.isActive = false
        } else {
            leadingConstraint.isActive = true
            trailingConstraint.isActive = false
        }

        bubbleView.widthAnchor.constraint(equalToConstant: bw).isActive = false
        for c in bubbleView.constraints where c.firstAttribute == .width { c.isActive = false }
        let wc = bubbleView.widthAnchor.constraint(equalToConstant: bw)
        wc.priority = .defaultHigh
        wc.isActive = true

        bubbleView.configure(message: message, resolvedReply: resolvedReply, theme: theme, bubbleWidth: bw)
        bubbleView.onReplyTap = onReplyTap
        bubbleView.onVideoTap = onVideoTap
        bubbleView.onFileTap = onFileTap
        bubbleView.onPollOptionTap = onPollOptionTap
        bubbleView.onPollDetailTap = onPollDetailTap
        bubbleView.onVoiceTap = onVoiceTap
    }

    // MARK: - Highlight

    func playHighlight() {
        let overlay = UIView(frame: bubbleView.bounds)
        overlay.backgroundColor = UIColor.systemYellow.withAlphaComponent(0.3)
        overlay.layer.cornerRadius = ChatLayout.bubbleCornerRadius
        overlay.alpha = 0
        bubbleView.addSubview(overlay)
        UIView.animate(withDuration: 0.2, animations: { overlay.alpha = 1 }) { _ in
            UIView.animate(withDuration: 0.6, delay: 0.4, animations: { overlay.alpha = 0 }) { _ in
                overlay.removeFromSuperview()
            }
        }
    }

    // MARK: - Reuse

    override func prepareForReuse() {
        super.prepareForReuse()
        onTap = nil
        onLongPress = nil
        onReplyTap = nil
        onVideoTap = nil
        onFileTap = nil
        onPollOptionTap = nil
        onPollDetailTap = nil
        onVoiceTap = nil
        for c in bubbleView.constraints where c.firstAttribute == .width { c.isActive = false }
        bubbleView.prepareForReuse()
    }

    // MARK: - Gestures

    @objc private func handleTap() { onTap?() }

    @objc private func handleLongPress(_ gesture: UILongPressGestureRecognizer) {
        if gesture.state == .began { onLongPress?(self) }
    }
}

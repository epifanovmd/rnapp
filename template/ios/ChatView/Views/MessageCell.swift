// MARK: - MessageCell.swift
// Message cell: fixed-size cell driven by FlowLayout sizeForItemAt.
// Bubble layout is Auto Layout; cell size is determined externally by MessageSizeCache.

import UIKit

// MARK: - Reply Preview View

final class ReplyPreviewBubble: UIView {

    private let accentBar: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.layer.cornerRadius = 1.5
        return v
    }()

    private let senderLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 12, weight: .semibold)
        l.translatesAutoresizingMaskIntoConstraints = false
        l.numberOfLines = 1
        return l
    }()

    private let contentLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 12)
        l.translatesAutoresizingMaskIntoConstraints = false
        l.numberOfLines = 2
        return l
    }()

    var onTap: (() -> Void)?

    override init(frame: CGRect) {
        super.init(frame: frame)
        layer.cornerRadius = 8
        layer.masksToBounds = true
        addSubview(accentBar)
        addSubview(senderLabel)
        addSubview(contentLabel)

        NSLayoutConstraint.activate([
            accentBar.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 6),
            accentBar.topAnchor.constraint(equalTo: topAnchor, constant: 5),
            accentBar.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -5),
            accentBar.widthAnchor.constraint(equalToConstant: 3),

            senderLabel.leadingAnchor.constraint(equalTo: accentBar.trailingAnchor, constant: 6),
            senderLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -8),
            senderLabel.topAnchor.constraint(equalTo: topAnchor, constant: 5),

            contentLabel.leadingAnchor.constraint(equalTo: senderLabel.leadingAnchor),
            contentLabel.trailingAnchor.constraint(equalTo: senderLabel.trailingAnchor),
            contentLabel.topAnchor.constraint(equalTo: senderLabel.bottomAnchor, constant: 1),
            contentLabel.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -5),
        ])

        let tap = UITapGestureRecognizer(target: self, action: #selector(tapped))
        addGestureRecognizer(tap)
        isUserInteractionEnabled = true
    }

    required init?(coder: NSCoder) { fatalError() }

    @objc private func tapped() { onTap?() }

    func configure(with reply: ReplyReference, isMine: Bool) {
        if isMine {
            backgroundColor = UIColor.white.withAlphaComponent(0.2)
            senderLabel.textColor = UIColor.white.withAlphaComponent(0.9)
            accentBar.backgroundColor = UIColor.white.withAlphaComponent(0.7)
            contentLabel.textColor = UIColor.white.withAlphaComponent(0.85)
        } else {
            backgroundColor = UIColor.black.withAlphaComponent(0.06)
            senderLabel.textColor = .systemBlue
            accentBar.backgroundColor = .systemBlue
            contentLabel.textColor = .secondaryLabel
        }

        // senderName == nil AND text == nil AND !hasImages → deleted message
        let isDeleted = reply.senderName == nil && reply.text == nil && !reply.hasImages
        if isDeleted {
            senderLabel.text = "Deleted message"
            contentLabel.text = ""
            contentLabel.isHidden = true
            alpha = 0.55
        } else {
            alpha = 1
            contentLabel.isHidden = false
            senderLabel.text = reply.senderName ?? "Message"
            if let text = reply.text, !text.isEmpty {
                contentLabel.text = text
            } else if reply.hasImages {
                contentLabel.text = "🖼 Photo"
            } else {
                contentLabel.text = "Message"
            }
        }
    }
}

// MARK: - Status View

final class MessageStatusView: UIView {

    private let imageView: UIImageView = {
        let iv = UIImageView()
        iv.contentMode = .scaleAspectFit
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        addSubview(imageView)
        NSLayoutConstraint.activate([
            imageView.leadingAnchor.constraint(equalTo: leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: trailingAnchor),
            imageView.topAnchor.constraint(equalTo: topAnchor),
            imageView.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
    }

    required init?(coder: NSCoder) { fatalError() }

    func configure(status: MessageStatus, isMine: Bool) {
        isHidden = !isMine
        guard isMine else { return }
        let cfg = UIImage.SymbolConfiguration(pointSize: 11, weight: .medium)
        switch status {
        case .sending:
            imageView.image = UIImage(systemName: "clock", withConfiguration: cfg)
            imageView.tintColor = UIColor.white.withAlphaComponent(0.7)
        case .sent:
            imageView.image = UIImage(systemName: "checkmark", withConfiguration: cfg)
            imageView.tintColor = UIColor.white.withAlphaComponent(0.7)
        case .delivered:
            imageView.image = UIImage(systemName: "checkmark.circle", withConfiguration: cfg)
            imageView.tintColor = UIColor.white.withAlphaComponent(0.7)
        case .read:
            imageView.image = UIImage(systemName: "checkmark.circle.fill", withConfiguration: cfg)
            imageView.tintColor = .white
        }
    }
}

// MARK: - Message Bubble View

/// Self-contained bubble. Its width is constrained by MessageCell's bubble width constraint.
/// Height is driven by Auto Layout from content — matches MessageSizeCalculator deterministically.
final class MessageBubbleView: UIView {

    // MARK: Subviews

    let replyPreview = ReplyPreviewBubble()

    private let imageGrid = BubbleImageGridView()

    private let textLabel: UILabel = {
        let l = UILabel()
        l.numberOfLines = 0
        l.font = MessageLayoutConstants.messageFont
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let footerStack: UIStackView = {
        let sv = UIStackView()
        sv.axis = .horizontal
        sv.spacing = MessageLayoutConstants.footerInternalSpacing
        sv.alignment = .center
        sv.translatesAutoresizingMaskIntoConstraints = false
        return sv
    }()

    private let timeLabel: UILabel = {
        let l = UILabel()
        l.font = MessageLayoutConstants.footerFont
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    let statusView = MessageStatusView()

    private let mainStack: UIStackView = {
        let sv = UIStackView()
        sv.axis = .vertical
        sv.spacing = MessageLayoutConstants.stackSpacing
        sv.translatesAutoresizingMaskIntoConstraints = false
        return sv
    }()

    private var imageGridHeightConstraint: NSLayoutConstraint?
    // Bubble width is set exactly by MessageCell — no min-width constraint needed here.

    // MARK: Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        layer.cornerRadius = 18
        clipsToBounds = true

        statusView.translatesAutoresizingMaskIntoConstraints = false
        statusView.widthAnchor.constraint(equalToConstant: MessageLayoutConstants.statusIconWidth).isActive = true
        statusView.heightAnchor.constraint(equalToConstant: 14).isActive = true

        footerStack.addArrangedSubview(timeLabel)
        footerStack.addArrangedSubview(statusView)

        replyPreview.translatesAutoresizingMaskIntoConstraints = false
        imageGrid.translatesAutoresizingMaskIntoConstraints = false

        addSubview(mainStack)
        mainStack.addArrangedSubview(replyPreview)
        mainStack.addArrangedSubview(imageGrid)
        mainStack.addArrangedSubview(textLabel)

        addSubview(footerStack)

        NSLayoutConstraint.activate([
            mainStack.topAnchor.constraint(equalTo: topAnchor,
                constant: MessageLayoutConstants.bubbleTopPad),
            mainStack.leadingAnchor.constraint(equalTo: leadingAnchor,
                constant: MessageLayoutConstants.bubbleHorizontalPad / 2),
            mainStack.trailingAnchor.constraint(equalTo: trailingAnchor,
                constant: -MessageLayoutConstants.bubbleHorizontalPad / 2),

            footerStack.trailingAnchor.constraint(equalTo: trailingAnchor,
                constant: -MessageLayoutConstants.footerTrailingPad),
            footerStack.bottomAnchor.constraint(equalTo: bottomAnchor,
                constant: -MessageLayoutConstants.bubbleBottomPad),
            footerStack.topAnchor.constraint(equalTo: mainStack.bottomAnchor,
                constant: MessageLayoutConstants.footerTopSpacing),
        ])
    }

    required init?(coder: NSCoder) { fatalError() }

    // MARK: Configure

    func configure(with message: ChatMessage) {
        // Colors
        if message.isMine {
            backgroundColor = UIColor(red: 0.18, green: 0.58, blue: 0.97, alpha: 1)
            textLabel.textColor = .white
            timeLabel.textColor = UIColor.white.withAlphaComponent(0.75)
        } else {
            backgroundColor = UIColor(white: 0.95, alpha: 1)
            textLabel.textColor = .label
            timeLabel.textColor = .secondaryLabel
        }

        // Reply
        if let reply = message.replyTo {
            replyPreview.isHidden = false
            replyPreview.configure(with: reply, isMine: message.isMine)
        } else {
            replyPreview.isHidden = true
        }

        // Images — height is fixed by MessageSizeCalculator formula so layout matches cache exactly
        if message.hasImages, let imgs = message.images {
            imageGrid.isHidden = false
        } else {
            imageGrid.isHidden = true
            imageGridHeightConstraint?.isActive = false
            imageGridHeightConstraint = nil
        }

        // Text
        if message.hasText {
            textLabel.isHidden = false
            textLabel.text = message.text
        } else {
            textLabel.isHidden = true
        }

        // Footer
        let timeText = DateHelper.shared.timeString(from: message.timestamp)
        timeLabel.text = timeText
        statusView.configure(status: message.status, isMine: message.isMine)
    }

    /// Called after configure when the actual bubble width is known.
    /// Applies image grid height so it exactly matches MessageSizeCalculator.
    func applyImageLayout(images: [ImageContent], bubbleWidth: CGFloat) {
        let imgWidth = bubbleWidth - MessageLayoutConstants.bubbleHorizontalPad
        let h: CGFloat
        switch images.count {
        case 1:  h = imgWidth * 0.6
        case 2:  h = imgWidth * 0.5
        default: h = imgWidth * 0.5
        }
        if imageGridHeightConstraint?.constant != h {
            imageGridHeightConstraint?.isActive = false
            imageGridHeightConstraint = imageGrid.heightAnchor.constraint(equalToConstant: h)
            imageGridHeightConstraint?.isActive = true
        }
        imageGrid.configure(images: images, width: imgWidth)
    }
}

// MARK: - Bubble Image Grid

final class BubbleImageGridView: UIView {

    private var imageViews: [UIImageView] = []

    override init(frame: CGRect) {
        super.init(frame: frame)
        clipsToBounds = true
        layer.cornerRadius = 10
    }

    required init?(coder: NSCoder) { fatalError() }

    func configure(images: [ImageContent], width: CGFloat) {
        imageViews.forEach { $0.removeFromSuperview() }
        imageViews = []

        let count = min(images.count, 4)
        let gap: CGFloat = 2

        for i in 0..<count {
            let iv = UIImageView()
            iv.contentMode = .scaleAspectFill
            iv.clipsToBounds = true
            iv.backgroundColor = .systemGray5
            iv.layer.cornerRadius = count > 1 ? 4 : 10
            iv.translatesAutoresizingMaskIntoConstraints = false
            addSubview(iv)
            imageViews.append(iv)
            loadImage(into: iv, from: images[i].url)
        }

        switch count {
        case 1:
            let iv = imageViews[0]
            NSLayoutConstraint.activate([
                iv.topAnchor.constraint(equalTo: topAnchor),
                iv.bottomAnchor.constraint(equalTo: bottomAnchor),
                iv.leadingAnchor.constraint(equalTo: leadingAnchor),
                iv.trailingAnchor.constraint(equalTo: trailingAnchor),
            ])

        case 2:
            NSLayoutConstraint.activate([
                imageViews[0].topAnchor.constraint(equalTo: topAnchor),
                imageViews[0].bottomAnchor.constraint(equalTo: bottomAnchor),
                imageViews[0].leadingAnchor.constraint(equalTo: leadingAnchor),
                imageViews[0].trailingAnchor.constraint(equalTo: centerXAnchor, constant: -gap / 2),

                imageViews[1].topAnchor.constraint(equalTo: topAnchor),
                imageViews[1].bottomAnchor.constraint(equalTo: bottomAnchor),
                imageViews[1].leadingAnchor.constraint(equalTo: centerXAnchor, constant: gap / 2),
                imageViews[1].trailingAnchor.constraint(equalTo: trailingAnchor),
            ])

        default:
            // Height is set externally by applyImageLayout — compute rowH from our own bounds height
            let totalH = (width * 0.5)  // matches estimatedHeight formula
            let rowH = (totalH - gap) / 2
            for i in 0..<count {
                let iv = imageViews[i]
                let col = i % 2
                let row = i / 2
                NSLayoutConstraint.activate([
                    iv.leadingAnchor.constraint(
                        equalTo: col == 0 ? leadingAnchor : centerXAnchor,
                        constant: col == 0 ? 0 : gap / 2),
                    iv.trailingAnchor.constraint(
                        equalTo: col == 0 ? centerXAnchor : trailingAnchor,
                        constant: col == 0 ? -gap / 2 : 0),
                    iv.topAnchor.constraint(equalTo: topAnchor, constant: CGFloat(row) * (rowH + gap)),
                    iv.heightAnchor.constraint(equalToConstant: rowH),
                ])
            }
        }
    }

    private func loadImage(into iv: UIImageView, from urlString: String) {
        guard let url = URL(string: urlString) else { return }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data, let img = UIImage(data: data) else { return }
            DispatchQueue.main.async { iv.image = img }
        }.resume()
    }
}

// MARK: - Message Cell

/// Cell width always equals collectionViewWidth (one cell per row).
/// Bubble width is an exact equalToConstant constraint derived from MessageSizeCalculator —
/// content-sized for text, max-width for images/replies. Alignment (leading/trailing) is
/// set per-message. No Auto Layout size negotiation with the layout engine — zero jumps.
final class MessageCell: UICollectionViewCell {

    static let reuseID = "MessageCell"

    private let bubbleView = MessageBubbleView()

    /// Pins bubble to leading edge (incoming messages).
    private var leadingConstraint: NSLayoutConstraint?
    /// Pins bubble to trailing edge (outgoing messages).
    private var trailingConstraint: NSLayoutConstraint?
    /// Exact bubble width — set to cellSize.width - cellSideMargin each configure.
    private var bubbleWidthConstraint: NSLayoutConstraint?

    var onReplyTap: ((String) -> Void)?
    /// Live resolver for reply references — used to reflect deleted-message state.
    var messageResolver: ((String) -> ChatMessage?)?
    private var currentMessage: ChatMessage?

    // MARK: Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        bubbleView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(bubbleView)

        let top    = bubbleView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 2)
        let bottom = bubbleView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -2)
        bottom.priority = UILayoutPriority(999) // cell height drives layout, not bubble

        leadingConstraint  = bubbleView.leadingAnchor.constraint(
            equalTo: contentView.leadingAnchor, constant: MessageLayoutConstants.cellSideMargin)
        trailingConstraint = bubbleView.trailingAnchor.constraint(
            equalTo: contentView.trailingAnchor, constant: -MessageLayoutConstants.cellSideMargin)

        NSLayoutConstraint.activate([top, bottom])
    }

    required init?(coder: NSCoder) { fatalError() }

    // MARK: Configure

    func configure(with message: ChatMessage, collectionViewWidth: CGFloat) {
        currentMessage = message

        let displayMessage = resolvedMessage(from: message)

        // Exact bubble width from cache formula — must match MessageSizeCalculator.bubbleWidth exactly
        let maxBubble   = floor(collectionViewWidth * MessageLayoutConstants.bubbleMaxWidthRatio)
        let exactBubbleW = MessageSizeCalculator.bubbleWidth(for: message, maxWidth: maxBubble)

        // Alignment: pin to the correct edge, exact width keeps bubble content-sized
        leadingConstraint?.isActive  = false
        trailingConstraint?.isActive = false
        bubbleWidthConstraint?.isActive = false

        bubbleWidthConstraint = bubbleView.widthAnchor.constraint(equalToConstant: exactBubbleW)
        bubbleWidthConstraint?.isActive = true

        if message.isMine {
            trailingConstraint?.isActive = true
        } else {
            leadingConstraint?.isActive = true
        }

        bubbleView.configure(with: displayMessage)

        if let imgs = displayMessage.images, !imgs.isEmpty {
            bubbleView.applyImageLayout(images: imgs, bubbleWidth: exactBubbleW)
        }

        bubbleView.replyPreview.onTap = { [weak self] in
            guard let replyId = self?.currentMessage?.replyTo?.id else { return }
            self?.onReplyTap?(replyId)
        }
    }

    // MARK: Highlight
    // Smooth orange: fast fade-in → brief hold → slow 3-second fade-out.

    func highlight(
        color: UIColor = UIColor.systemOrange.withAlphaComponent(0.45),
        duration: TimeInterval = 3.0
    ) {
        bubbleView.layer.removeAllAnimations()
        let original = bubbleView.backgroundColor ?? .clear

        UIView.animateKeyframes(
            withDuration: duration,
            delay: 0,
            options: [.calculationModeCubic, .allowUserInteraction, .beginFromCurrentState]
        ) {
            UIView.addKeyframe(withRelativeStartTime: 0.00, relativeDuration: 0.08) {
                self.bubbleView.backgroundColor = color
            }
            UIView.addKeyframe(withRelativeStartTime: 0.08, relativeDuration: 0.12) {
                self.bubbleView.backgroundColor = color
            }
            UIView.addKeyframe(withRelativeStartTime: 0.20, relativeDuration: 0.80) {
                self.bubbleView.backgroundColor = original
            }
        } completion: { [weak self] _ in
            self?.bubbleView.backgroundColor = original
        }
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        bubbleView.layer.removeAllAnimations()
        currentMessage = nil
        onReplyTap = nil
        messageResolver = nil
    }

    // MARK: Private

    private func resolvedMessage(from message: ChatMessage) -> ChatMessage {
        guard let replyId = message.replyTo?.id else { return message }

        let resolvedReply: ReplyReference
        if let live = messageResolver?(replyId) {
            resolvedReply = ReplyReference(
                id: live.id,
                text: live.text,
                senderName: live.senderName,
                hasImages: live.hasImages
            )
        } else if messageResolver != nil {
            // messageResolver exists but returned nil → message was deleted
            resolvedReply = ReplyReference(id: replyId, text: nil, senderName: nil, hasImages: false)
        } else {
            return message
        }

        return ChatMessage(
            id: message.id,
            text: message.text,
            images: message.images,
            timestamp: message.timestamp,
            senderName: message.senderName,
            isMine: message.isMine,
            groupDate: message.groupDate,
            status: message.status,
            replyTo: resolvedReply
        )
    }
}

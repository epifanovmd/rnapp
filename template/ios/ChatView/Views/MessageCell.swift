// MARK: - MessageCell.swift
// Message cell: bubble with text/images, time + status inside, reply preview, no avatar

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
        let accent = UIColor.systemBlue
        accentBar.backgroundColor = accent
        senderLabel.textColor = accent

        if isMine {
            backgroundColor = UIColor.white.withAlphaComponent(0.2)
            senderLabel.textColor = UIColor.white.withAlphaComponent(0.9)
            accentBar.backgroundColor = UIColor.white.withAlphaComponent(0.7)
            contentLabel.textColor = UIColor.white.withAlphaComponent(0.85)
        } else {
            backgroundColor = UIColor.black.withAlphaComponent(0.06)
            senderLabel.textColor = UIColor.systemBlue
            accentBar.backgroundColor = UIColor.systemBlue
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

// MARK: - Status View (checkmarks)

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

        let config = UIImage.SymbolConfiguration(pointSize: 11, weight: .medium)
        switch status {
        case .sending:
            imageView.image = UIImage(systemName: "clock", withConfiguration: config)
            imageView.tintColor = UIColor.white.withAlphaComponent(0.7)
        case .sent:
            imageView.image = UIImage(systemName: "checkmark", withConfiguration: config)
            imageView.tintColor = UIColor.white.withAlphaComponent(0.7)
        case .delivered:
            imageView.image = UIImage(systemName: "checkmark.circle", withConfiguration: config)
            imageView.tintColor = UIColor.white.withAlphaComponent(0.7)
        case .read:
            imageView.image = UIImage(systemName: "checkmark.circle.fill", withConfiguration: config)
            imageView.tintColor = UIColor.white
        }
    }
}

// MARK: - Message Bubble View

/// Self-contained bubble that holds: optional reply, image grid, optional text,
/// and a footer row with time + status.
final class MessageBubbleView: UIView {

    // MARK: Subviews

    let replyPreview = ReplyPreviewBubble()

    private let imageGrid = BubbleImageGridView()

    private let textLabel: UILabel = {
        let l = UILabel()
        l.numberOfLines = 0
        l.font = .systemFont(ofSize: 16)
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let footerStack: UIStackView = {
        let sv = UIStackView()
        sv.axis = .horizontal
        sv.spacing = 3
        sv.alignment = .center
        sv.translatesAutoresizingMaskIntoConstraints = false
        return sv
    }()

    private let timeLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 11)
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let statusView = MessageStatusView()

    private let mainStack: UIStackView = {
        let sv = UIStackView()
        sv.axis = .vertical
        sv.spacing = 4
        sv.translatesAutoresizingMaskIntoConstraints = false
        return sv
    }()

    private var imageGridHeightConstraint: NSLayoutConstraint?

    // MARK: Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        layer.cornerRadius = 18
        clipsToBounds = true

        statusView.translatesAutoresizingMaskIntoConstraints = false
        statusView.widthAnchor.constraint(equalToConstant: 16).isActive = true
        statusView.heightAnchor.constraint(equalToConstant: 14).isActive = true

        footerStack.addArrangedSubview(timeLabel)
        footerStack.addArrangedSubview(statusView)

        replyPreview.translatesAutoresizingMaskIntoConstraints = false
        imageGrid.translatesAutoresizingMaskIntoConstraints = false
        textLabel.translatesAutoresizingMaskIntoConstraints = false

        addSubview(mainStack)
        mainStack.addArrangedSubview(replyPreview)
        mainStack.addArrangedSubview(imageGrid)
        mainStack.addArrangedSubview(textLabel)

        // Footer pinned to bottom-right
        addSubview(footerStack)

        NSLayoutConstraint.activate([
            mainStack.topAnchor.constraint(equalTo: topAnchor, constant: 8),
            mainStack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 10),
            mainStack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -10),

            footerStack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -10),
            footerStack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -6),
            footerStack.topAnchor.constraint(equalTo: mainStack.bottomAnchor, constant: 2),
        ])
    }

    required init?(coder: NSCoder) { fatalError() }

    // MARK: Configure

    func configure(with message: ChatMessage, maxWidth: CGFloat) {
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

        // Images
        if message.hasImages, let imgs = message.images {
            imageGrid.isHidden = false
            let imgWidth = maxWidth - 20
            let h = BubbleImageGridView.estimatedHeight(count: imgs.count, width: imgWidth)
            imageGridHeightConstraint?.isActive = false
            imageGridHeightConstraint = imageGrid.heightAnchor.constraint(equalToConstant: h)
            imageGridHeightConstraint?.isActive = true
            imageGrid.configure(images: imgs, width: imgWidth)
        } else {
            imageGrid.isHidden = true
            imageGridHeightConstraint?.isActive = false
        }

        // Text
        if message.hasText {
            textLabel.isHidden = false
            textLabel.text = message.text
        } else {
            textLabel.isHidden = true
        }

        // Footer
        timeLabel.text = DateHelper.shared.timeString(from: message.timestamp)
        statusView.configure(status: message.status, isMine: message.isMine)
    }

    static func estimatedHeight(for message: ChatMessage, maxWidth: CGFloat) -> CGFloat {
        var h: CGFloat = 8 + 6 + 18 // top padding + footer + bottom padding

        if message.replyTo != nil {
            h += 52 + 4
        }

        if message.hasImages, let imgs = message.images {
            h += BubbleImageGridView.estimatedHeight(count: imgs.count, width: maxWidth - 20) + 4
        }

        if message.hasText, let text = message.text {
            let font = UIFont.systemFont(ofSize: 16)
            let constraintWidth = maxWidth - 20
            let size = text.boundingRect(
                with: CGSize(width: constraintWidth, height: .greatestFiniteMagnitude),
                options: [.usesLineFragmentOrigin, .usesFontLeading],
                attributes: [.font: font],
                context: nil
            )
            h += ceil(size.height) + 4
        }

        return max(h, 44)
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
            iv.backgroundColor = UIColor.systemGray5
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
                imageViews[0].trailingAnchor.constraint(equalTo: centerXAnchor, constant: -gap/2),

                imageViews[1].topAnchor.constraint(equalTo: topAnchor),
                imageViews[1].bottomAnchor.constraint(equalTo: bottomAnchor),
                imageViews[1].leadingAnchor.constraint(equalTo: centerXAnchor, constant: gap/2),
                imageViews[1].trailingAnchor.constraint(equalTo: trailingAnchor),
            ])

        default:
            let cellH = BubbleImageGridView.estimatedHeight(count: count, width: width)
            let rowH = (cellH - gap) / 2
            for i in 0..<count {
                let iv = imageViews[i]
                let col = i % 2
                let row = i / 2
                NSLayoutConstraint.activate([
                    iv.leadingAnchor.constraint(equalTo: col == 0 ? leadingAnchor : centerXAnchor, constant: col == 0 ? 0 : gap/2),
                    iv.trailingAnchor.constraint(equalTo: col == 0 ? centerXAnchor : trailingAnchor, constant: col == 0 ? -gap/2 : 0),
                    iv.topAnchor.constraint(equalTo: topAnchor, constant: CGFloat(row) * (rowH + gap)),
                    iv.heightAnchor.constraint(equalToConstant: rowH),
                ])
            }
        }
    }

    static func estimatedHeight(count: Int, width: CGFloat) -> CGFloat {
        switch count {
        case 1: return width * 0.6
        case 2: return width * 0.5
        default: return width * 0.5
        }
    }

    private func loadImage(into iv: UIImageView, from urlString: String) {
        guard let url = URL(string: urlString) else { return }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data, let img = UIImage(data: data) else { return }
            DispatchQueue.main.async { iv.image = img }
        }.resume()
    }
}

// MARK: - Message Cell

final class MessageCell: UICollectionViewCell {
    static let reuseID = "MessageCell"

    private let bubbleView = MessageBubbleView()

    private var leadingConstraint: NSLayoutConstraint?
    private var trailingConstraint: NSLayoutConstraint?
    private var widthConstraint: NSLayoutConstraint?

    var onReplyTap: ((String) -> Void)?
    /// Provides the latest version of a message by id — used to show live reply preview.
    var messageResolver: ((String) -> ChatMessage?)?
    private var currentMessage: ChatMessage?

    // MARK: Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        bubbleView.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(bubbleView)

        NSLayoutConstraint.activate([
            bubbleView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 2),
            bubbleView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -2),
        ])

        leadingConstraint = bubbleView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 8)
        trailingConstraint = bubbleView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -8)
        widthConstraint = bubbleView.widthAnchor.constraint(lessThanOrEqualTo: contentView.widthAnchor, multiplier: 0.80)
        widthConstraint?.isActive = true
    }

    required init?(coder: NSCoder) { fatalError() }

    // MARK: Configure

    func configure(with message: ChatMessage, maxBubbleWidth: CGFloat) {
        currentMessage = message

        // Deactivate both, then activate the correct one
        leadingConstraint?.isActive = false
        trailingConstraint?.isActive = false

        if message.isMine {
            trailingConstraint?.isActive = true
        } else {
            leadingConstraint?.isActive = true
        }

        // Resolve the live reply reference so deleted messages are reflected.
        var resolvedMessage = message
        if let replyId = message.replyTo?.id, let live = messageResolver?(replyId) {
            // Rebuild with up-to-date reply data from the live message list.
            let liveReply = ReplyReference(
                id: live.id,
                text: live.text,
                senderName: live.senderName,
                hasImages: live.hasImages
            )
            resolvedMessage = ChatMessage(
                id: message.id,
                text: message.text,
                images: message.images,
                timestamp: message.timestamp,
                senderName: message.senderName,
                isMine: message.isMine,
                groupDate: message.groupDate,
                status: message.status,
                replyTo: liveReply
            )
        } else if let replyId = message.replyTo?.id, messageResolver?(replyId) == nil, messageResolver != nil {
            // Original message was deleted — show placeholder.
            let deletedReply = ReplyReference(
                id: replyId,
                text: nil,
                senderName: nil,
                hasImages: false
            )
            resolvedMessage = ChatMessage(
                id: message.id,
                text: message.text,
                images: message.images,
                timestamp: message.timestamp,
                senderName: message.senderName,
                isMine: message.isMine,
                groupDate: message.groupDate,
                status: message.status,
                replyTo: deletedReply
            )
        }

        bubbleView.configure(with: resolvedMessage, maxWidth: maxBubbleWidth)

        bubbleView.replyPreview.onTap = { [weak self] in
            guard let replyId = self?.currentMessage?.replyTo?.id else { return }
            self?.onReplyTap?(replyId)
        }
    }

    // MARK: Highlight
    // Telegram-style: gentle fade-in of a tinted overlay, then slow fade-out.

    func highlight(
        color: UIColor = UIColor.systemBlue.withAlphaComponent(0.18),
        duration: TimeInterval = 1.6
    ) {
        // Remove any in-flight animation
        bubbleView.layer.removeAnimation(forKey: "highlightOverlay")

        let original = bubbleView.backgroundColor ?? .clear

        // Phase 1 — fade in (20% of total)
        // Phase 2 — hold briefly (10%)
        // Phase 3 — fade out (70%)
        UIView.animateKeyframes(
            withDuration: duration,
            delay: 0,
            options: [.calculationModeLinear, .allowUserInteraction, .beginFromCurrentState]
        ) {
            UIView.addKeyframe(withRelativeStartTime: 0.0, relativeDuration: 0.15) {
                self.bubbleView.backgroundColor = color
            }
            UIView.addKeyframe(withRelativeStartTime: 0.15, relativeDuration: 0.10) {
                // hold — no change, keyframe just reserves time
                self.bubbleView.backgroundColor = color
            }
            UIView.addKeyframe(withRelativeStartTime: 0.25, relativeDuration: 0.75) {
                self.bubbleView.backgroundColor = original
            }
        } completion: { [weak self] _ in
            // Guarantee restoration even if interrupted
            self?.bubbleView.backgroundColor = original
        }
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        layer.removeAnimation(forKey: "highlight")
        currentMessage = nil
        onReplyTap = nil
        messageResolver = nil
    }
}

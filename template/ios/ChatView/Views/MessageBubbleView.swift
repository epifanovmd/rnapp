import UIKit

final class MessageBubbleView: UIView {

    // MARK: - Callbacks

    var onReplyTap: (() -> Void)?
    var onVideoTap: ((String) -> Void)?
    var onFileTap: ((String, String) -> Void)?
    var onPollOptionTap: ((String, String) -> Void)?
    var onPollDetailTap: ((String) -> Void)?
    var onVoiceTap: ((String) -> Void)?

    // MARK: - Subviews

    private let stack = UIStackView()
    private let senderLabel = UILabel()
    private let forwardedLabel = UILabel()
    private let replyPreview = ReplyPreviewView()
    private var contentView: UIView?
    private let reactionsView = ReactionsView()
    private let footerContainer = UIView()
    private let editedLabel = UILabel()
    private let timeLabel = UILabel()
    private let statusView = MessageStatusView()

    private var isEmojiOnly = false

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        layer.cornerRadius = ChatLayout.bubbleCornerRadius
        layer.masksToBounds = true

        stack.axis = .vertical
        stack.spacing = ChatLayout.bubbleSpacing
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)

        senderLabel.font = ChatLayout.senderNameFont
        senderLabel.numberOfLines = 1
        forwardedLabel.font = ChatLayout.forwardedFont
        forwardedLabel.numberOfLines = 1
        editedLabel.font = ChatLayout.editedFont
        editedLabel.text = "edited"
        timeLabel.font = ChatLayout.timeFont

        setupFooter()

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor, constant: ChatLayout.bubbleVPad),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: ChatLayout.bubbleHPad),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -ChatLayout.bubbleHPad),
        ])
    }

    private func setupFooter() {
        footerContainer.translatesAutoresizingMaskIntoConstraints = false
        [editedLabel, timeLabel, statusView].forEach {
            $0.translatesAutoresizingMaskIntoConstraints = false
            footerContainer.addSubview($0)
        }

        NSLayoutConstraint.activate([
            footerContainer.heightAnchor.constraint(equalToConstant: ChatLayout.footerHeight),
            statusView.trailingAnchor.constraint(equalTo: footerContainer.trailingAnchor),
            statusView.centerYAnchor.constraint(equalTo: footerContainer.centerYAnchor),
            statusView.widthAnchor.constraint(equalToConstant: ChatLayout.statusIconSize),
            statusView.heightAnchor.constraint(equalToConstant: ChatLayout.statusIconSize),
            timeLabel.trailingAnchor.constraint(equalTo: statusView.leadingAnchor, constant: -ChatLayout.footerSpacing),
            timeLabel.centerYAnchor.constraint(equalTo: footerContainer.centerYAnchor),
            editedLabel.trailingAnchor.constraint(equalTo: timeLabel.leadingAnchor, constant: -ChatLayout.footerSpacing),
            editedLabel.centerYAnchor.constraint(equalTo: footerContainer.centerYAnchor),
        ])
    }

    // MARK: - Configure

    func configure(message: ChatMessage, resolvedReply: ReplyDisplayInfo?, theme: ChatTheme, bubbleWidth: CGFloat) {
        let isMine = message.isMine
        isEmojiOnly = EmojiHelper.emojiOnlyCount(message.content.text) != nil

        // Background
        if isEmojiOnly {
            backgroundColor = .clear
            layer.cornerRadius = 0
        } else {
            backgroundColor = isMine ? theme.outgoingBubble : theme.incomingBubble
            layer.cornerRadius = ChatLayout.bubbleCornerRadius
        }

        stack.arrangedSubviews.forEach { stack.removeArrangedSubview($0); $0.removeFromSuperview() }

        // Sender Name
        if let name = message.senderName, !isMine {
            senderLabel.text = name
            senderLabel.textColor = theme.incomingSenderName
            stack.addArrangedSubview(senderLabel)
        }

        // Forwarded
        if let fwd = message.forwardedFrom {
            forwardedLabel.text = "↗ \(fwd)"
            forwardedLabel.textColor = isMine ? theme.outgoingForwardedLabel : theme.incomingForwardedLabel
            stack.addArrangedSubview(forwardedLabel)
        }

        // Reply Preview
        if let reply = message.reply {
            replyPreview.configure(reply: reply, resolved: resolvedReply, isMine: isMine, theme: theme)
            replyPreview.onTap = { [weak self] in self?.onReplyTap?() }
            stack.addArrangedSubview(replyPreview)
        }

        // Content
        let innerW = bubbleWidth - ChatLayout.bubbleHPad * 2
        let newContent = createContentView(for: message, width: innerW, isMine: isMine, theme: theme)
        contentView = newContent
        stack.addArrangedSubview(newContent)

        // Reactions
        if !message.reactions.isEmpty {
            reactionsView.configure(reactions: message.reactions, theme: theme)
            stack.addArrangedSubview(reactionsView)
        }

        // Footer
        if !isEmojiOnly {
            configureFooter(message: message, isMine: isMine, theme: theme)
            stack.addArrangedSubview(footerContainer)
        }
    }

    // MARK: - Content Factory

    private func createContentView(for msg: ChatMessage, width: CGFloat, isMine: Bool, theme: ChatTheme) -> UIView {
        if let count = EmojiHelper.emojiOnlyCount(msg.content.text) {
            return createEmojiView(text: msg.content.text!, count: count)
        }

        switch msg.content {
        case .text(let p):
            return createTextView(text: p.text, isMine: isMine, theme: theme, width: width)

        case .image(let p):
            return createImageView(images: p.images, width: width)

        case .mixed(let t, let p):
            let container = UIStackView()
            container.axis = .vertical
            container.spacing = 4
            container.addArrangedSubview(createImageView(images: p.images, width: width))
            container.addArrangedSubview(createTextView(text: t.text, isMine: isMine, theme: theme, width: width))
            return container

        case .video(let v):
            return createVideoView(video: v, width: width, theme: theme)

        case .mixedTextVideo(let t, let v):
            let container = UIStackView()
            container.axis = .vertical
            container.spacing = 4
            container.addArrangedSubview(createVideoView(video: v, width: width, theme: theme))
            container.addArrangedSubview(createTextView(text: t.text, isMine: isMine, theme: theme, width: width))
            return container

        case .voice(let v):
            let view = VoiceContentView()
            view.configure(voice: v, isMine: isMine, theme: theme)
            view.onPlayTap = { [weak self] in self?.onVoiceTap?(v.url) }
            return view

        case .poll(let p):
            let view = PollContentView()
            view.configure(poll: p, isMine: isMine, theme: theme)
            view.onOptionTap = { [weak self] optionId in self?.onPollOptionTap?(p.id, optionId) }
            view.onDetailTap = { [weak self] in self?.onPollDetailTap?(p.id) }
            return view

        case .file(let f):
            let view = FileContentView()
            view.configure(file: f, isMine: isMine, theme: theme)
            view.onTap = { [weak self] in self?.onFileTap?(f.url, f.name) }
            return view
        }
    }

    private func createEmojiView(text: String, count: Int) -> UILabel {
        let label = UILabel()
        label.text = text
        label.font = MessageSizeCalculator.emojiFont(for: count)
        label.textAlignment = .center
        return label
    }

    private func createTextView(text: String, isMine: Bool, theme: ChatTheme, width: CGFloat) -> UIView {
        let view = TextContentView()
        view.configure(text: text, isMine: isMine, theme: theme)
        return view
    }

    private func createImageView(images: [ImageItem], width: CGFloat) -> UIView {
        let view = ImageContentView()
        view.configure(images: images, width: width)
        return view
    }

    private func createVideoView(video: VideoPayload, width: CGFloat, theme: ChatTheme) -> UIView {
        let view = VideoContentView()
        view.configure(video: video, width: width, theme: theme)
        view.onTap = { [weak self] in self?.onVideoTap?(video.url) }
        return view
    }

    // MARK: - Footer

    private func configureFooter(message: ChatMessage, isMine: Bool, theme: ChatTheme) {
        timeLabel.text = DateHelper.shared.timeString(from: message.timestamp)
        timeLabel.textColor = isMine ? theme.outgoingTime : theme.incomingTime
        editedLabel.isHidden = !message.isEdited
        editedLabel.textColor = isMine ? theme.outgoingEdited : theme.incomingEdited
        statusView.configure(status: message.status, isMine: isMine, theme: theme)
    }

    // MARK: - Reuse

    func prepareForReuse() {
        stack.arrangedSubviews.forEach { stack.removeArrangedSubview($0); $0.removeFromSuperview() }
        contentView = nil
        onReplyTap = nil
        onVideoTap = nil
        onFileTap = nil
        onPollOptionTap = nil
        onPollDetailTap = nil
        onVoiceTap = nil
    }
}

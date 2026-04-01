// MARK: - MessageContentViews.swift
// Protocol + конкретные view-рендереры для каждого типа контента.

import UIKit

// MARK: - Protocol

protocol MessageContentView: UIView {
    func configure(content: MessageContent, isMine: Bool, theme: ChatTheme)
    func applyLayout(bubbleWidth: CGFloat)
    func prepareForReuse()
}

extension MessageContentView {
    func prepareForReuse() {}
}

// MARK: - Factory

enum MessageContentViewFactory {

    static func make(for content: MessageContent) -> any MessageContentView {
        switch content {
        case .text:           return TextContentView()
        case .image:          return ImageContentView()
        case .mixed:          return MixedContentView()
        case .video:          return VideoContentView()
        case .mixedTextVideo: return MixedTextVideoContentView()
        case .poll:           return PollContentView()
        case .file:           return FileContentView()
        }
    }

    static func matches(_ view: (any MessageContentView)?, content: MessageContent) -> Bool {
        switch content {
        case .text:           return view is TextContentView
        case .image:          return view is ImageContentView
        case .mixed:          return view is MixedContentView
        case .video:          return view is VideoContentView
        case .mixedTextVideo: return view is MixedTextVideoContentView
        case .poll:           return view is PollContentView
        case .file:           return view is FileContentView
        }
    }
}

// MARK: - Emoji detection utility

enum EmojiHelper {

    /// Возвращает количество emoji (1–3) если строка содержит ТОЛЬКО emoji, иначе nil.
    static func emojiOnlyCount(_ text: String) -> Int? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        let scalars = trimmed.unicodeScalars
        // Быстрая проверка: если длина в скалярах > 12 — точно не 1–3 emoji
        guard scalars.count <= 12 else { return nil }
        // Подсчитываем графемные кластеры
        var count = 0
        for char in trimmed {
            guard char.isEmoji else { return nil }
            count += 1
            if count > 3 { return nil }
        }
        return count > 0 ? count : nil
    }

    static func font(forCount count: Int) -> UIFont {
        switch count {
        case 1:  return ChatLayoutConstants.emojiOnlyFont1
        case 2:  return ChatLayoutConstants.emojiOnlyFont2
        default: return ChatLayoutConstants.emojiOnlyFont3
        }
    }
}

private extension Character {
    var isEmoji: Bool {
        guard let scalar = unicodeScalars.first else { return false }
        // Variation selector, ZWJ — не standalone emoji
        if unicodeScalars.count == 1 {
            switch scalar.value {
            case 0xFE00...0xFE0F, 0x200D: return false
            default: break
            }
        }
        return scalar.properties.isEmoji && (
            scalar.properties.isEmojiPresentation ||
            unicodeScalars.count > 1
        )
    }
}

// MARK: - TextContentView

final class TextContentView: UIView, MessageContentView {

    private let label: UILabel = {
        let l = UILabel()
        l.numberOfLines = 0
        l.font = ChatLayoutConstants.messageFont
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    /// true если текущий контент — emoji-only (для внешнего использования в BubbleView).
    private(set) var isEmojiOnly = false
    private(set) var emojiCount  = 0

    override init(frame: CGRect) {
        super.init(frame: frame)
        addSubview(label)
        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: topAnchor),
            label.bottomAnchor.constraint(equalTo: bottomAnchor),
            label.leadingAnchor.constraint(equalTo: leadingAnchor),
            label.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented — use init(frame:)")
    }

    func configure(content: MessageContent, isMine: Bool, theme: ChatTheme) {
        let body = content.text ?? ""
        if let count = EmojiHelper.emojiOnlyCount(body) {
            isEmojiOnly = true
            emojiCount  = count
            label.font          = EmojiHelper.font(forCount: count)
            label.textAlignment = .center
            label.textColor     = .label
        } else {
            isEmojiOnly = false
            emojiCount  = 0
            label.font          = ChatLayoutConstants.messageFont
            label.textAlignment = .natural
            label.textColor     = isMine ? theme.outgoingTextColor : theme.incomingTextColor
        }
        label.text = body
    }

    func applyLayout(bubbleWidth: CGFloat) {}
}

// MARK: - ImageContentView

final class ImageContentView: UIView, MessageContentView {

    private static let imageCache: NSCache<NSString, UIImage> = {
        let c = NSCache<NSString, UIImage>()
        c.countLimit     = 200
        c.totalCostLimit = 50 * 1024 * 1024
        return c
    }()

    private(set) var imageView: UIImageView = {
        let iv = UIImageView()
        iv.contentMode        = .scaleAspectFill
        iv.clipsToBounds      = true
        iv.backgroundColor    = .systemGray5
        iv.layer.cornerRadius = 9
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()

    private var heightConstraint: NSLayoutConstraint?
    private var currentURL:       String?
    private var loadingTask:       URLSessionDataTask?

    override init(frame: CGRect) {
        super.init(frame: frame)
        addSubview(imageView)
        NSLayoutConstraint.activate([
            imageView.topAnchor.constraint(equalTo: topAnchor),
            imageView.bottomAnchor.constraint(equalTo: bottomAnchor),
            imageView.leadingAnchor.constraint(equalTo: leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented — use init(frame:)")
    }

    func configure(content: MessageContent, isMine: Bool, theme: ChatTheme) {
        guard let payload = content.image else { return }
        currentURL = payload.url
        loadImage(from: payload.thumbnailUrl ?? payload.url)
    }

    func applyLayout(bubbleWidth: CGFloat) {
        let w = bubbleWidth - ChatLayoutConstants.bubbleHorizontalPad
        let h = MessageSizeCalculator.imageHeight(width: w)
        guard heightConstraint?.constant != h else { return }
        heightConstraint?.isActive = false
        heightConstraint = imageView.heightAnchor.constraint(equalToConstant: h)
        heightConstraint?.isActive = true
    }

    func prepareForReuse() {
        loadingTask?.cancel()
        loadingTask = nil
        currentURL  = nil
        imageView.image = nil
    }

    // MARK: - Image loading

    func loadImage(from urlString: String) {
        let key = urlString as NSString
        if let cached = Self.imageCache.object(forKey: key) {
            imageView.image = cached
            return
        }
        imageView.image = nil
        loadingTask?.cancel()
        guard let url = URL(string: urlString) else { return }

        let task = URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
            guard
                let self,
                let data,
                let img = UIImage(data: data),
                self.currentURL == urlString
            else { return }
            Self.imageCache.setObject(img, forKey: key, cost: data.count)
            DispatchQueue.main.async { self.imageView.image = img }
        }
        loadingTask = task
        task.resume()
    }
}

// MARK: - MixedContentView (image + text)

final class MixedContentView: UIView, MessageContentView {

    private let imageView = ImageContentView()
    private let textView  = TextContentView()

    private let stack: UIStackView = {
        let sv = UIStackView()
        sv.axis    = .vertical
        sv.spacing = ChatLayoutConstants.stackSpacing
        sv.translatesAutoresizingMaskIntoConstraints = false
        return sv
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        stack.addArrangedSubview(imageView)
        stack.addArrangedSubview(textView)
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented — use init(frame:)")
    }

    func configure(content: MessageContent, isMine: Bool, theme: ChatTheme) {
        imageView.configure(content: content, isMine: isMine, theme: theme)
        textView.configure(content: content, isMine: isMine, theme: theme)
    }

    func applyLayout(bubbleWidth: CGFloat) {
        imageView.applyLayout(bubbleWidth: bubbleWidth)
        textView.applyLayout(bubbleWidth: bubbleWidth)
    }

    func prepareForReuse() {
        imageView.prepareForReuse()
    }
}

// MARK: - VideoContentView
// Thumbnail с play-кнопкой и badge длительности.

final class VideoContentView: UIView, MessageContentView {

    private let thumbnailView = ImageContentView()

    private let playButton: UIImageView = {
        let config = UIImage.SymbolConfiguration(pointSize: ChatLayoutConstants.videoPlayButtonSize * 0.5,
                                                  weight: .regular)
        let iv = UIImageView(image: UIImage(systemName: "play.circle.fill", withConfiguration: config))
        iv.tintColor       = UIColor.white.withAlphaComponent(0.9)
        iv.contentMode     = .center
        iv.translatesAutoresizingMaskIntoConstraints = false
        iv.layer.shadowColor   = UIColor.black.cgColor
        iv.layer.shadowOpacity = 0.3
        iv.layer.shadowRadius  = 4
        iv.layer.shadowOffset  = .zero
        return iv
    }()

    private let durationLabel: UILabel = {
        let l = UILabel()
        l.font      = ChatLayoutConstants.videoDurationFont
        l.textColor = .white
        l.textAlignment = .center
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let durationBg: UIView = {
        let v = UIView()
        v.backgroundColor    = UIColor.black.withAlphaComponent(0.55)
        v.layer.cornerRadius = ChatLayoutConstants.videoDurationCorner
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private var videoPayload: MessageContent.VideoPayload?

    override init(frame: CGRect) {
        super.init(frame: frame)
        addSubview(thumbnailView)
        thumbnailView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(playButton)
        addSubview(durationBg)
        durationBg.addSubview(durationLabel)

        NSLayoutConstraint.activate([
            thumbnailView.topAnchor.constraint(equalTo: topAnchor),
            thumbnailView.bottomAnchor.constraint(equalTo: bottomAnchor),
            thumbnailView.leadingAnchor.constraint(equalTo: leadingAnchor),
            thumbnailView.trailingAnchor.constraint(equalTo: trailingAnchor),

            playButton.centerXAnchor.constraint(equalTo: centerXAnchor),
            playButton.centerYAnchor.constraint(equalTo: centerYAnchor),
            playButton.widthAnchor.constraint(equalToConstant: ChatLayoutConstants.videoPlayButtonSize),
            playButton.heightAnchor.constraint(equalToConstant: ChatLayoutConstants.videoPlayButtonSize),

            durationBg.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -6),
            durationBg.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -6),

            durationLabel.topAnchor.constraint(equalTo: durationBg.topAnchor,
                                                constant: ChatLayoutConstants.videoDurationPadV),
            durationLabel.bottomAnchor.constraint(equalTo: durationBg.bottomAnchor,
                                                   constant: -ChatLayoutConstants.videoDurationPadV),
            durationLabel.leadingAnchor.constraint(equalTo: durationBg.leadingAnchor,
                                                    constant: ChatLayoutConstants.videoDurationPadH),
            durationLabel.trailingAnchor.constraint(equalTo: durationBg.trailingAnchor,
                                                     constant: -ChatLayoutConstants.videoDurationPadH),
        ])
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented — use init(frame:)")
    }

    func configure(content: MessageContent, isMine: Bool, theme: ChatTheme) {
        guard let payload = content.video else { return }
        videoPayload = payload
        // Загружаем thumbnail через ImageContentView с подменой контента
        if let thumb = payload.thumbnailUrl {
            thumbnailView.loadImage(from: thumb)
        } else {
            thumbnailView.imageView.image = nil
            thumbnailView.imageView.backgroundColor = .systemGray4
        }
        // Duration badge
        if let dur = payload.duration, dur > 0 {
            durationBg.isHidden = false
            durationLabel.text  = Self.formatDuration(dur)
        } else {
            durationBg.isHidden = true
        }
    }

    func applyLayout(bubbleWidth: CGFloat) {
        thumbnailView.applyLayout(bubbleWidth: bubbleWidth)
    }

    func prepareForReuse() {
        thumbnailView.prepareForReuse()
        videoPayload = nil
    }

    private static func formatDuration(_ seconds: TimeInterval) -> String {
        let total = Int(seconds)
        let m = total / 60
        let s = total % 60
        return String(format: "%d:%02d", m, s)
    }
}

// MARK: - MixedTextVideoContentView (video + text)

final class MixedTextVideoContentView: UIView, MessageContentView {

    private let videoView = VideoContentView()
    private let textView  = TextContentView()

    private let stack: UIStackView = {
        let sv = UIStackView()
        sv.axis    = .vertical
        sv.spacing = ChatLayoutConstants.stackSpacing
        sv.translatesAutoresizingMaskIntoConstraints = false
        return sv
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        stack.addArrangedSubview(videoView)
        stack.addArrangedSubview(textView)
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented — use init(frame:)")
    }

    func configure(content: MessageContent, isMine: Bool, theme: ChatTheme) {
        videoView.configure(content: content, isMine: isMine, theme: theme)
        textView.configure(content: content, isMine: isMine, theme: theme)
    }

    func applyLayout(bubbleWidth: CGFloat) {
        videoView.applyLayout(bubbleWidth: bubbleWidth)
    }

    func prepareForReuse() {
        videoView.prepareForReuse()
    }
}

// MARK: - PollContentView
// Telegram-style poll: вопрос, опции с progress bar, итого голосов.

final class PollContentView: UIView, MessageContentView {

    /// Коллбэк при нажатии на опцию. Устанавливается из BubbleView.
    var onOptionTap: ((String, String) -> Void)?  // (pollId, optionId)

    private let questionLabel: UILabel = {
        let l = UILabel()
        l.font          = ChatLayoutConstants.pollQuestionFont
        l.numberOfLines = 0
        return l
    }()

    private let totalVotesLabel: UILabel = {
        let l = UILabel()
        l.font = ChatLayoutConstants.pollVotesFont
        return l
    }()

    private let stack: UIStackView = {
        let sv = UIStackView()
        sv.axis    = .vertical
        sv.spacing = ChatLayoutConstants.pollSpacing
        sv.translatesAutoresizingMaskIntoConstraints = false
        return sv
    }()

    private var optionViews: [PollOptionRowView] = []
    private var pollPayload: MessageContent.PollPayload?

    override init(frame: CGRect) {
        super.init(frame: frame)
        stack.addArrangedSubview(questionLabel)
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented — use init(frame:)")
    }

    func configure(content: MessageContent, isMine: Bool, theme: ChatTheme) {
        guard let poll = content.poll else { return }
        pollPayload = poll

        questionLabel.text      = poll.question
        questionLabel.textColor = isMine ? theme.outgoingTextColor : theme.incomingTextColor

        // Удаляем старые option views
        optionViews.forEach { $0.removeFromSuperview() }
        optionViews.removeAll()

        // Убираем totalVotesLabel из стека если он там
        totalVotesLabel.removeFromSuperview()

        for option in poll.options {
            let row = PollOptionRowView()
            row.configure(option: option,
                          isSelected: option.id == poll.selectedOptionId,
                          isClosed: poll.isClosed,
                          isMine: isMine,
                          theme: theme)
            row.onTap = { [weak self] in
                guard let self, let p = self.pollPayload, !p.isClosed else { return }
                self.onOptionTap?(p.id, option.id)
            }
            stack.addArrangedSubview(row)
            optionViews.append(row)
        }

        totalVotesLabel.text = "\(poll.totalVotes) votes"
        totalVotesLabel.textColor = isMine
            ? theme.outgoingTextColor.withAlphaComponent(0.6)
            : theme.incomingTextColor.withAlphaComponent(0.6)
        stack.addArrangedSubview(totalVotesLabel)
    }

    func applyLayout(bubbleWidth: CGFloat) {}

    func prepareForReuse() {
        optionViews.forEach { $0.removeFromSuperview() }
        optionViews.removeAll()
        totalVotesLabel.removeFromSuperview()
        pollPayload = nil
        onOptionTap = nil
    }
}

// MARK: - PollOptionRowView

private final class PollOptionRowView: UIView {

    var onTap: (() -> Void)?

    private let barBg: UIView = {
        let v = UIView()
        v.layer.cornerRadius = ChatLayoutConstants.pollBarCornerRadius
        v.clipsToBounds      = true
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let barFill: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let textLabel: UILabel = {
        let l = UILabel()
        l.font          = ChatLayoutConstants.pollOptionFont
        l.numberOfLines = 1
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let percentLabel: UILabel = {
        let l = UILabel()
        l.font          = ChatLayoutConstants.pollOptionFont
        l.textAlignment = .right
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let checkmark: UIImageView = {
        let config = UIImage.SymbolConfiguration(pointSize: 12, weight: .semibold)
        let iv = UIImageView(image: UIImage(systemName: "checkmark", withConfiguration: config))
        iv.translatesAutoresizingMaskIntoConstraints = false
        iv.isHidden = true
        return iv
    }()

    private var fillWidthConstraint: NSLayoutConstraint?

    override init(frame: CGRect) {
        super.init(frame: frame)
        addSubview(barBg)
        barBg.addSubview(barFill)
        addSubview(textLabel)
        addSubview(percentLabel)
        addSubview(checkmark)

        NSLayoutConstraint.activate([
            heightAnchor.constraint(equalToConstant: ChatLayoutConstants.pollBarHeight),
            barBg.topAnchor.constraint(equalTo: topAnchor),
            barBg.bottomAnchor.constraint(equalTo: bottomAnchor),
            barBg.leadingAnchor.constraint(equalTo: leadingAnchor),
            barBg.trailingAnchor.constraint(equalTo: trailingAnchor),

            barFill.topAnchor.constraint(equalTo: barBg.topAnchor),
            barFill.bottomAnchor.constraint(equalTo: barBg.bottomAnchor),
            barFill.leadingAnchor.constraint(equalTo: barBg.leadingAnchor),

            checkmark.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 8),
            checkmark.centerYAnchor.constraint(equalTo: centerYAnchor),
            checkmark.widthAnchor.constraint(equalToConstant: ChatLayoutConstants.pollCheckmarkSize),

            textLabel.leadingAnchor.constraint(equalTo: checkmark.trailingAnchor, constant: 4),
            textLabel.centerYAnchor.constraint(equalTo: centerYAnchor),
            textLabel.trailingAnchor.constraint(lessThanOrEqualTo: percentLabel.leadingAnchor, constant: -4),

            percentLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -8),
            percentLabel.centerYAnchor.constraint(equalTo: centerYAnchor),
            percentLabel.widthAnchor.constraint(greaterThanOrEqualToConstant: 32),
        ])

        let tap = UITapGestureRecognizer(target: self, action: #selector(tapped))
        addGestureRecognizer(tap)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented — use init(frame:)")
    }

    func configure(option: MessageContent.PollOption, isSelected: Bool, isClosed: Bool,
                   isMine: Bool, theme: ChatTheme) {
        textLabel.text    = option.text
        percentLabel.text = "\(Int(option.percentage))%"

        let textColor = isMine ? theme.outgoingTextColor : theme.incomingTextColor
        textLabel.textColor    = textColor
        percentLabel.textColor = textColor.withAlphaComponent(0.7)

        let accentColor = isMine ? theme.outgoingReplyAccent : theme.incomingReplyAccent
        barBg.backgroundColor   = accentColor.withAlphaComponent(0.12)
        barFill.backgroundColor = isSelected ? accentColor.withAlphaComponent(0.35) : accentColor.withAlphaComponent(0.2)

        checkmark.isHidden = !isSelected
        checkmark.tintColor = accentColor

        // Ширина fill пропорционально проценту
        fillWidthConstraint?.isActive = false
        fillWidthConstraint = barFill.widthAnchor.constraint(equalTo: barBg.widthAnchor,
                                                              multiplier: max(0.01, CGFloat(option.percentage) / 100))
        fillWidthConstraint?.isActive = true

        isUserInteractionEnabled = !isClosed
        alpha = isClosed ? 0.7 : 1.0
    }

    @objc private func tapped() { onTap?() }
}

// MARK: - FileContentView
// Иконка файла + имя + размер.

final class FileContentView: UIView, MessageContentView {

    /// Коллбэк при нажатии на файл.
    var onFileTap: ((String, String) -> Void)?  // (fileUrl, fileName)

    private let iconView: UIImageView = {
        let iv = UIImageView()
        iv.contentMode = .scaleAspectFit
        iv.tintColor   = .systemBlue
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()

    private let nameLabel: UILabel = {
        let l = UILabel()
        l.font          = ChatLayoutConstants.fileNameFont
        l.numberOfLines = 1
        l.lineBreakMode = .byTruncatingMiddle
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let sizeLabel: UILabel = {
        let l = UILabel()
        l.font = ChatLayoutConstants.fileSizeFont
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private var filePayload: MessageContent.FilePayload?

    override init(frame: CGRect) {
        super.init(frame: frame)
        addSubview(iconView)
        addSubview(nameLabel)
        addSubview(sizeLabel)

        NSLayoutConstraint.activate([
            heightAnchor.constraint(equalToConstant: ChatLayoutConstants.fileRowHeight),

            iconView.leadingAnchor.constraint(equalTo: leadingAnchor),
            iconView.centerYAnchor.constraint(equalTo: centerYAnchor),
            iconView.widthAnchor.constraint(equalToConstant: ChatLayoutConstants.fileIconSize),
            iconView.heightAnchor.constraint(equalToConstant: ChatLayoutConstants.fileIconSize),

            nameLabel.leadingAnchor.constraint(equalTo: iconView.trailingAnchor,
                                                constant: ChatLayoutConstants.fileSpacing),
            nameLabel.trailingAnchor.constraint(equalTo: trailingAnchor),
            nameLabel.topAnchor.constraint(equalTo: topAnchor, constant: 4),

            sizeLabel.leadingAnchor.constraint(equalTo: nameLabel.leadingAnchor),
            sizeLabel.trailingAnchor.constraint(equalTo: trailingAnchor),
            sizeLabel.topAnchor.constraint(equalTo: nameLabel.bottomAnchor, constant: 2),
        ])

        let tap = UITapGestureRecognizer(target: self, action: #selector(tapped))
        addGestureRecognizer(tap)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented — use init(frame:)")
    }

    func configure(content: MessageContent, isMine: Bool, theme: ChatTheme) {
        guard let file = content.file else { return }
        filePayload = file

        nameLabel.text      = file.name
        nameLabel.textColor = isMine ? theme.outgoingTextColor : theme.incomingTextColor
        sizeLabel.text      = Self.formatSize(file.size)
        sizeLabel.textColor = (isMine ? theme.outgoingTextColor : theme.incomingTextColor).withAlphaComponent(0.6)

        let icon = Self.iconName(for: file.mimeType)
        iconView.image = UIImage(systemName: icon)
        iconView.tintColor = isMine ? theme.outgoingTextColor.withAlphaComponent(0.7) : .systemBlue
    }

    func applyLayout(bubbleWidth: CGFloat) {}

    func prepareForReuse() {
        filePayload = nil
        onFileTap   = nil
    }

    @objc private func tapped() {
        guard let f = filePayload else { return }
        onFileTap?(f.url, f.name)
    }

    private static func formatSize(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }

    private static func iconName(for mimeType: String?) -> String {
        guard let mime = mimeType?.lowercased() else { return "doc.fill" }
        if mime.hasPrefix("image/")       { return "photo" }
        if mime.hasPrefix("video/")       { return "film" }
        if mime.hasPrefix("audio/")       { return "music.note" }
        if mime.contains("pdf")           { return "doc.richtext" }
        if mime.contains("zip") || mime.contains("rar") || mime.contains("tar") { return "archivebox" }
        if mime.contains("text")          { return "doc.text" }
        return "doc.fill"
    }
}

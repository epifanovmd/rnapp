// MARK: - MessageContentViews.swift
// Protocol + конкретные view-рендереры для каждого типа контента.
//
// Добавление нового типа сообщения:
//   1. Создать XxxContentView: UIView, MessageContentView
//   2. Добавить case в MessageContentViewFactory.make(for:)
//   Остальной код (Cell, BubbleView, Calculator) не трогать.

import UIKit

// MARK: - Protocol

/// Единый контракт для любого рендерера контента.
protocol MessageContentView: UIView {
    /// Заполняет данными и применяет тему.
    func configure(content: MessageContent, isMine: Bool, theme: ChatTheme)
    /// Вызывается после установки точной ширины пузыря (из MessageCell).
    func applyLayout(bubbleWidth: CGFloat)
}

// MARK: - Factory

enum MessageContentViewFactory {

    /// Создаёт подходящий рендерер для данного типа контента.
    static func make(for content: MessageContent) -> any MessageContentView {
        switch content {
        case .text:   return TextContentView()
        case .image:  return ImageContentView()
        case .mixed:  return MixedContentView()
        }
    }

    /// Возвращает true, если текущий view совместим с новым типом контента.
    /// Используется в MessageBubbleView для решения — пересоздавать view или нет.
    static func matches(_ view: (any MessageContentView)?, content: MessageContent) -> Bool {
        switch content {
        case .text:   return view is TextContentView
        case .image:  return view is ImageContentView
        case .mixed:  return view is MixedContentView
        }
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
    required init?(coder: NSCoder) { fatalError() }

    func configure(content: MessageContent, isMine: Bool, theme: ChatTheme) {
        label.text      = content.text
        label.textColor = isMine ? theme.outgoingTextColor : theme.incomingTextColor
    }

    func applyLayout(bubbleWidth: CGFloat) {}
}

// MARK: - ImageContentView
// Одно изображение с асинхронной загрузкой и shared NSCache.

final class ImageContentView: UIView, MessageContentView {

    // Shared image cache: один на всё приложение, переживает переиспользование ячеек.
    private static let imageCache: NSCache<NSString, UIImage> = {
        let c = NSCache<NSString, UIImage>()
        c.countLimit      = 200
        c.totalCostLimit  = 50 * 1024 * 1024   // 50 МБ
        return c
    }()

    private let imageView: UIImageView = {
        let iv = UIImageView()
        iv.contentMode        = .scaleAspectFill
        iv.clipsToBounds      = true
        iv.backgroundColor    = .systemGray5
        iv.layer.cornerRadius = 9
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()

    private var heightConstraint: NSLayoutConstraint?
    private var currentURL: String?
    private var loadingTask: URLSessionDataTask?

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
    required init?(coder: NSCoder) { fatalError() }

    func configure(content: MessageContent, isMine: Bool, theme: ChatTheme) {
        guard let payload = content.image else { return }
        currentURL = payload.url
        loadImage(from: payload.thumbnailUrl ?? payload.url)
    }

    /// Устанавливает высоту imageView по вычисленному ratio из Calculator.
    func applyLayout(bubbleWidth: CGFloat) {
        let w = bubbleWidth - ChatLayoutConstants.bubbleHorizontalPad
        let h = MessageSizeCalculator.imageHeight(width: w)
        if heightConstraint?.constant != h {
            heightConstraint?.isActive = false
            heightConstraint = imageView.heightAnchor.constraint(equalToConstant: h)
            heightConstraint?.isActive = true
        }
    }

    // MARK: - Image loading

    private func loadImage(from urlString: String) {
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
            Self.imageCache.setObject(img, forKey: key,
                                      cost: data.count)
            DispatchQueue.main.async { self.imageView.image = img }
        }
        loadingTask = task
        task.resume()
    }
}

// MARK: - MixedContentView
// Изображение сверху + текст снизу — стандартная компоновка Telegram/Instagram.

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
    required init?(coder: NSCoder) { fatalError() }

    func configure(content: MessageContent, isMine: Bool, theme: ChatTheme) {
        imageView.configure(content: content, isMine: isMine, theme: theme)
        textView.configure(content: content, isMine: isMine, theme: theme)
    }

    func applyLayout(bubbleWidth: CGFloat) {
        imageView.applyLayout(bubbleWidth: bubbleWidth)
        textView.applyLayout(bubbleWidth: bubbleWidth)
    }
}

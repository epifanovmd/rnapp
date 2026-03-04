// MARK: - MessageContentViews.swift
// Protocol + конкретные view-рендереры для каждого типа контента.
//
// Добавление нового типа сообщения:
//   1. Создать XxxContentView: UIView, MessageContentView
//   2. Добавить case в MessageContentViewFactory.make(for:)
//   Всё остальное не трогать.

import UIKit

// MARK: - Protocol

protocol MessageContentView: UIView {
    func configure(content: MessageContent, isMine: Bool)
    /// Вызывается из MessageCell после того как установлена точная ширина пузыря.
    func applyLayout(bubbleWidth: CGFloat)
}

// MARK: - Factory

enum MessageContentViewFactory {
    static func make(for content: MessageContent) -> any MessageContentView {
        switch content {
        case .text:   return TextContentView()
        case .images: return ImagesContentView()
        case .mixed:  return MixedContentView()
        }
    }

    /// Возвращает true если текущий view соответствует типу нового контента.
    /// Используется в BubbleView для решения — пересоздавать ли contentView.
    static func matches(_ view: (any MessageContentView)?, content: MessageContent) -> Bool {
        switch content {
        case .text:   return view is TextContentView
        case .images: return view is ImagesContentView
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

    func configure(content: MessageContent, isMine: Bool) {
        label.text      = content.text
        label.textColor = isMine ? .white : .label
    }

    func applyLayout(bubbleWidth: CGFloat) {}
}

// MARK: - ImagesContentView

final class ImagesContentView: UIView, MessageContentView {

    private let grid = BubbleImageGridView()
    private var heightConstraint: NSLayoutConstraint?
    private var pendingImages: [MessageContent.ImagesPayload.ImageItem] = []

    override init(frame: CGRect) {
        super.init(frame: frame)
        grid.translatesAutoresizingMaskIntoConstraints = false
        addSubview(grid)
        NSLayoutConstraint.activate([
            grid.topAnchor.constraint(equalTo: topAnchor),
            grid.bottomAnchor.constraint(equalTo: bottomAnchor),
            grid.leadingAnchor.constraint(equalTo: leadingAnchor),
            grid.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }
    required init?(coder: NSCoder) { fatalError() }

    func configure(content: MessageContent, isMine: Bool) {
        pendingImages = content.images ?? []
    }

    func applyLayout(bubbleWidth: CGFloat) {
        guard !pendingImages.isEmpty else { return }
        let w = bubbleWidth - ChatLayoutConstants.bubbleHorizontalPad
        let h = MessageSizeCalculator.imageGridHeight(count: pendingImages.count, width: w)
        if heightConstraint?.constant != h {
            heightConstraint?.isActive = false
            heightConstraint = grid.heightAnchor.constraint(equalToConstant: h)
            heightConstraint?.isActive = true
        }
        grid.configure(images: pendingImages, width: w)
    }
}

// MARK: - MixedContentView

final class MixedContentView: UIView, MessageContentView {

    private let imagesView = ImagesContentView()
    private let textView   = TextContentView()
    private let stack: UIStackView = {
        let sv = UIStackView()
        sv.axis    = .vertical
        sv.spacing = ChatLayoutConstants.stackSpacing
        sv.translatesAutoresizingMaskIntoConstraints = false
        return sv
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        addSubview(stack)
        stack.addArrangedSubview(imagesView)
        stack.addArrangedSubview(textView)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }
    required init?(coder: NSCoder) { fatalError() }

    func configure(content: MessageContent, isMine: Bool) {
        imagesView.configure(content: content, isMine: isMine)
        textView.configure(content: content, isMine: isMine)
    }

    func applyLayout(bubbleWidth: CGFloat) {
        imagesView.applyLayout(bubbleWidth: bubbleWidth)
        textView.applyLayout(bubbleWidth: bubbleWidth)
    }
}

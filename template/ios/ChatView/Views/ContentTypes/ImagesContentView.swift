// MARK: - ImagesContentView.swift
// Рендерер сообщения только с изображениями (content == .images).

import UIKit

final class ImagesContentView: UIView, MessageContentView {

    private let grid = BubbleImageGridView()
    private var heightConstraint: NSLayoutConstraint?

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
        // Данные сохраняются, layout применяется в applyLayout когда известна ширина
        grid.cancelAndReset()
        if let imgs = content.images, !imgs.isEmpty {
            // Передаём ширину 0 — реальная ширина придёт в applyLayout
            // Изображения начнут загружаться немедленно через ImageCache
            _pendingImages = imgs
        }
    }

    private var _pendingImages: [MessageContent.ImagesPayload.ImageItem] = []

    func applyLayout(bubbleWidth: CGFloat) {
        guard !_pendingImages.isEmpty else { return }
        let w = bubbleWidth - ChatLayoutConstants.bubbleHorizontalPad
        let h = MessageSizeCalculator.imageGridHeight(count: _pendingImages.count, width: w)

        if heightConstraint?.constant != h {
            heightConstraint?.isActive = false
            heightConstraint = grid.heightAnchor.constraint(equalToConstant: h)
            heightConstraint?.isActive = true
        }
        grid.configure(images: _pendingImages, width: w)
        _pendingImages = []
    }

    func cancelAsync() {
        grid.cancelAndReset()
        _pendingImages = []
    }
}

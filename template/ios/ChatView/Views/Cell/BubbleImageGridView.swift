// MARK: - BubbleImageGridView.swift
//
// Сетка 1–4 изображений внутри пузыря сообщения.
// Изображения загружаются через ImageCache — повторное появление
// ячейки при скролле даёт мгновенный результат из памяти без мерцания.
//
// Layout:
//   1 фото  → полная ширина, высота = width × 0.6
//   2 фото  → две колонки, Auto Layout
//   3–4 фото → две колонки, frame-based в layoutSubviews (пропорционально высоте)

import UIKit

final class BubbleImageGridView: UIView {

    // MARK: - State

    private var imageViews: [UIImageView] = []
    private var tokens:     [ImageLoadToken] = []
    private var imageCount  = 0

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        clipsToBounds = true
        layer.cornerRadius = 9
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Configure

    /// Вызывается каждый раз когда ячейка конфигурируется.
    /// Отменяет предыдущие загрузки, сбрасывает изображения, запускает новые.
    func configure(images: [MessageContent.ImagesPayload.ImageItem], width: CGFloat) {
        cancelAndReset()

        let count = min(images.count, 4)
        guard count > 0 else { return }
        imageCount = count

        for item in images.prefix(count) {
            let iv = makeImageView()
            addSubview(iv)
            imageViews.append(iv)

            if let url = URL(string: item.url) {
                // Синхронный кэш-хит → iv.image устанавливается до того как
                // ячейка попадёт на экран → нет пустого прямоугольника при скролле.
                let token = ImageCache.shared.load(url: url) { [weak iv] img in
                    iv?.image = img
                }
                tokens.append(token)
            }
        }

        switch count {
        case 1: pinFull(imageViews[0])
        case 2: layoutTwoColumns(gap: 2)
        default: setNeedsLayout()   // layoutSubviews сделает frame-layout
        }
    }

    /// Вызывается из prepareForReuse — отменяет загрузки и очищает изображения.
    func cancelAndReset() {
        tokens.forEach { $0.invalidate() }
        tokens     = []
        imageViews.forEach { $0.removeFromSuperview() }
        imageViews = []
        imageCount = 0
    }

    // MARK: - Layout

    override func layoutSubviews() {
        super.layoutSubviews()
        guard imageCount >= 3, !imageViews.isEmpty,
              bounds.width > 0, bounds.height > 0 else { return }

        let gap: CGFloat = 2
        let cols = 2
        let rows = Int(ceil(Double(imageCount) / Double(cols)))
        let cellW = (bounds.width  - gap * CGFloat(cols - 1)) / CGFloat(cols)
        let cellH = (bounds.height - gap * CGFloat(rows - 1)) / CGFloat(rows)

        for (i, iv) in imageViews.enumerated() {
            let col = i % cols
            let row = i / cols
            iv.frame = CGRect(x: CGFloat(col) * (cellW + gap),
                              y: CGFloat(row) * (cellH + gap),
                              width:  cellW,
                              height: cellH)
        }
    }

    // MARK: - Private helpers

    private func makeImageView() -> UIImageView {
        let iv = UIImageView()
        iv.contentMode     = .scaleAspectFill
        iv.clipsToBounds   = true
        iv.backgroundColor = UIColor(white: 0.92, alpha: 1)
        iv.layer.cornerRadius = imageCount == 1 ? 9 : 4
        iv.translatesAutoresizingMaskIntoConstraints = (imageCount <= 2)
        return iv
    }

    private func pinFull(_ iv: UIImageView) {
        NSLayoutConstraint.activate([
            iv.topAnchor.constraint(equalTo: topAnchor),
            iv.bottomAnchor.constraint(equalTo: bottomAnchor),
            iv.leadingAnchor.constraint(equalTo: leadingAnchor),
            iv.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }

    private func layoutTwoColumns(gap: CGFloat) {
        guard imageViews.count == 2 else { return }
        let iv0 = imageViews[0], iv1 = imageViews[1]
        NSLayoutConstraint.activate([
            iv0.topAnchor.constraint(equalTo: topAnchor),
            iv0.bottomAnchor.constraint(equalTo: bottomAnchor),
            iv0.leadingAnchor.constraint(equalTo: leadingAnchor),
            iv0.trailingAnchor.constraint(equalTo: centerXAnchor, constant: -gap/2),

            iv1.topAnchor.constraint(equalTo: topAnchor),
            iv1.bottomAnchor.constraint(equalTo: bottomAnchor),
            iv1.leadingAnchor.constraint(equalTo: centerXAnchor, constant: gap/2),
            iv1.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }
}

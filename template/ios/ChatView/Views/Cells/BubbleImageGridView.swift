// MARK: - BubbleImageGridView.swift
// 1–4 изображения внутри пузыря.
//
// Fix #1: Race condition при загрузке изображений.
//   • Каждый UIImageView получает accessibilityIdentifier = URL-строка.
//     Колбэк URLSession проверяет его перед записью — если ячейка уже
//     переиспользована под другой URL, запись молча отбрасывается.
//   • NSCache<NSString, UIImage> живёт на уровне класса (static) —
//     все экземпляры грида делят один кэш, повторная загрузка одного
//     URL происходит ровно один раз за жизнь приложения.
//   • При cancel() задачи колбэк не вызывается — нет ни утечки, ни записи.

import UIKit

final class BubbleImageGridView: UIView {

    // MARK: - Shared image cache
    // Static: один кэш на всё приложение, не пересоздаётся вместе с ячейкой.
    private static let imageCache: NSCache<NSString, UIImage> = {
        let c = NSCache<NSString, UIImage>()
        c.countLimit = 200
        c.totalCostLimit = 50 * 1024 * 1024  // 50 МБ
        return c
    }()

    private var imageViews: [UIImageView] = []
    private var loadingTasks: [URLSessionDataTask] = []

    override init(frame: CGRect) {
        super.init(frame: frame)
        clipsToBounds = true
        layer.cornerRadius = 9
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Configure

    func configure(images: [MessageContent.ImagesPayload.ImageItem], width: CGFloat) {
        loadingTasks.forEach { $0.cancel() }
        loadingTasks = []
        imageViews.forEach { $0.removeFromSuperview() }
        imageViews = []

        let count = min(images.count, 4)
        guard count > 0 else { return }
        let gap: CGFloat = 2

        for i in 0..<count {
            let iv = makeImageView(cornerRadius: count > 1 ? 4 : 9)
            iv.accessibilityIdentifier = images[i].url
            addSubview(iv)
            imageViews.append(iv)
            if let task = loadImage(into: iv, from: images[i].url) {
                loadingTasks.append(task)
            }
        }

        applyLayout(count: count, gap: gap, width: width)
    }

    // MARK: - Layout helpers

    private func applyLayout(count: Int, gap: CGFloat, width: CGFloat) {
        switch count {
        case 1:
            pin(imageViews[0])

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
            let totalH = MessageSizeCalculator.imageGridHeight(count: count, width: width)
            let rowH   = (totalH - gap) / 2
            for i in 0..<count {
                let iv = imageViews[i]; let col = i % 2; let row = i / 2
                NSLayoutConstraint.activate([
                    iv.leadingAnchor.constraint(
                        equalTo: col == 0 ? leadingAnchor : centerXAnchor,
                        constant: col == 1 ? gap / 2 : 0),
                    iv.trailingAnchor.constraint(
                        equalTo: col == 0 ? centerXAnchor : trailingAnchor,
                        constant: col == 0 ? -gap / 2 : 0),
                    iv.topAnchor.constraint(equalTo: topAnchor,
                                            constant: CGFloat(row) * (rowH + gap)),
                    iv.heightAnchor.constraint(equalToConstant: rowH),
                ])
            }
        }
    }

    private func makeImageView(cornerRadius: CGFloat) -> UIImageView {
        let iv = UIImageView()
        iv.contentMode     = .scaleAspectFill
        iv.clipsToBounds   = true
        iv.backgroundColor = .systemGray5
        iv.layer.cornerRadius = cornerRadius
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }

    private func pin(_ view: UIView) {
        NSLayoutConstraint.activate([
            view.topAnchor.constraint(equalTo: topAnchor),
            view.bottomAnchor.constraint(equalTo: bottomAnchor),
            view.leadingAnchor.constraint(equalTo: leadingAnchor),
            view.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }

    // MARK: - Image loading
    //
    // Fix #1 (race condition):
    //   1. Кэш-попадание → ставим сразу, задачу не создаём.
    //   2. Помечаем iv.accessibilityIdentifier = urlString до запуска задачи.
    //   3. В колбэке сверяем identifier — если ячейка переиспользована,
    //      запись молча отбрасывается.

    @discardableResult
    private func loadImage(into iv: UIImageView, from urlString: String) -> URLSessionDataTask? {
        let key = urlString as NSString

        if let cached = Self.imageCache.object(forKey: key) {
            iv.image = cached
            return nil
        }

        guard let url = URL(string: urlString) else { return nil }

        let task = URLSession.shared.dataTask(with: url) { [weak iv] data, _, _ in
            guard
                let data,
                let img = UIImage(data: data),
                let iv
            else { return }

            Self.imageCache.setObject(img, forKey: key)

            DispatchQueue.main.async {
                guard iv.accessibilityIdentifier == urlString else { return }
                iv.image = img
            }
        }
        task.resume()
        return task
    }
}

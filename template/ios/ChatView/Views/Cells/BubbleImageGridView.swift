// MARK: - BubbleImageGridView.swift
// 1–4 изображения внутри пузыря.

import UIKit

final class BubbleImageGridView: UIView {

    private var imageViews: [UIImageView] = []
    private var loadingTasks: [URLSessionDataTask] = []

    override init(frame: CGRect) {
        super.init(frame: frame)
        clipsToBounds = true
        layer.cornerRadius = 9
    }
    required init?(coder: NSCoder) { fatalError() }

    func configure(images: [MessageContent.ImagesPayload.ImageItem], width: CGFloat) {
        // Отменяем предыдущие загрузки при переиспользовании ячейки
        loadingTasks.forEach { $0.cancel() }
        loadingTasks = []
        imageViews.forEach { $0.removeFromSuperview() }
        imageViews = []

        let count = min(images.count, 4)
        guard count > 0 else { return }
        let gap: CGFloat = 2

        for i in 0..<count {
            let iv = UIImageView()
            iv.contentMode    = .scaleAspectFill
            iv.clipsToBounds  = true
            iv.backgroundColor = .systemGray5
            iv.layer.cornerRadius = count > 1 ? 4 : 9
            iv.translatesAutoresizingMaskIntoConstraints = false
            addSubview(iv)
            imageViews.append(iv)
            if let task = loadImage(into: iv, from: images[i].url) {
                loadingTasks.append(task)
            }
        }

        switch count {
        case 1:
            pin(imageViews[0])

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
            let totalH = MessageSizeCalculator.imageGridHeight(count: count, width: width)
            let rowH   = (totalH - gap) / 2
            for i in 0..<count {
                let iv = imageViews[i]; let col = i % 2; let row = i / 2
                NSLayoutConstraint.activate([
                    iv.leadingAnchor.constraint(
                        equalTo: col == 0 ? leadingAnchor : centerXAnchor,
                        constant: col == 1 ? gap/2 : 0),
                    iv.trailingAnchor.constraint(
                        equalTo: col == 0 ? centerXAnchor : trailingAnchor,
                        constant: col == 0 ? -gap/2 : 0),
                    iv.topAnchor.constraint(equalTo: topAnchor,
                                            constant: CGFloat(row) * (rowH + gap)),
                    iv.heightAnchor.constraint(equalToConstant: rowH),
                ])
            }
        }
    }

    private func pin(_ view: UIView) {
        NSLayoutConstraint.activate([
            view.topAnchor.constraint(equalTo: topAnchor),
            view.bottomAnchor.constraint(equalTo: bottomAnchor),
            view.leadingAnchor.constraint(equalTo: leadingAnchor),
            view.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }

    @discardableResult
    private func loadImage(into iv: UIImageView, from urlString: String) -> URLSessionDataTask? {
        guard let url = URL(string: urlString) else { return nil }
        let task = URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data, let img = UIImage(data: data) else { return }
            DispatchQueue.main.async { iv.image = img }
        }
        task.resume()
        return task
    }
}

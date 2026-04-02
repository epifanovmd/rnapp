import UIKit

final class ImageContentView: UIView {
    private let imageView = UIImageView()
    private var heightConstraint: NSLayoutConstraint?

    override init(frame: CGRect) {
        super.init(frame: frame)
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.layer.cornerRadius = ChatLayout.imageCornerRadius
        imageView.backgroundColor = UIColor(white: 0.9, alpha: 1)
        imageView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(imageView)
        NSLayoutConstraint.activate([
            imageView.topAnchor.constraint(equalTo: topAnchor),
            imageView.leadingAnchor.constraint(equalTo: leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: trailingAnchor),
            imageView.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
    }

    required init?(coder: NSCoder) { fatalError() }

    func configure(images: [ImageItem], width: CGFloat) {
        guard let first = images.first else { return }

        let h = MessageSizeCalculator.imageHeight(first, width: width)
        heightConstraint?.isActive = false
        heightConstraint = imageView.heightAnchor.constraint(equalToConstant: h)
        heightConstraint?.priority = .defaultHigh
        heightConstraint?.isActive = true

        let url = first.thumbnailUrl ?? first.url
        imageView.loadChatImage(url: url)
    }

    func prepareForReuse() {
        imageView.cancelImageLoad()
        imageView.image = nil
        heightConstraint?.isActive = false
    }
}

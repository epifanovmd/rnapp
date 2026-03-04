// MARK: - MessageStatusView.swift
// Delivery/read status icon shown in the message footer.

import UIKit

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
            imageView.topAnchor.constraint(equalTo: topAnchor),
            imageView.bottomAnchor.constraint(equalTo: bottomAnchor),
            imageView.leadingAnchor.constraint(equalTo: leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }

    required init?(coder: NSCoder) { fatalError() }

    func configure(status: MessageStatus, isMine: Bool) {
        isHidden = !isMine
        guard isMine else { return }

        let cfg = UIImage.SymbolConfiguration(pointSize: 10, weight: .medium)
        let dimWhite = UIColor.white.withAlphaComponent(0.7)

        switch status {
        case .sending:
            imageView.image    = UIImage(systemName: "clock", withConfiguration: cfg)
            imageView.tintColor = dimWhite
        case .sent:
            imageView.image    = UIImage(systemName: "checkmark", withConfiguration: cfg)
            imageView.tintColor = dimWhite
        case .delivered:
            imageView.image    = UIImage(systemName: "checkmark.circle", withConfiguration: cfg)
            imageView.tintColor = dimWhite
        case .read:
            imageView.image    = UIImage(systemName: "checkmark.circle.fill", withConfiguration: cfg)
            imageView.tintColor = .white
        }
    }
}

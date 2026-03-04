// MARK: - MessageStatusView.swift
// Иконка статуса доставки/прочтения в footer пузыря.
// Показывается только для исходящих сообщений (isMine == true).

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

    // MARK: - Configure

    /// Применяет иконку и цвет статуса в соответствии с темой.
    func configure(status: MessageStatus, isMine: Bool, theme: ChatTheme) {
        isHidden = !isMine
        guard isMine else { return }

        let cfg = UIImage.SymbolConfiguration(pointSize: 10, weight: .medium)
        switch status {
        case .sending:
            imageView.image     = UIImage(systemName: "clock", withConfiguration: cfg)
            imageView.tintColor = theme.outgoingStatusColor
        case .sent:
            imageView.image     = UIImage(systemName: "checkmark", withConfiguration: cfg)
            imageView.tintColor = theme.outgoingStatusColor
        case .delivered:
            imageView.image     = UIImage(systemName: "checkmark.circle", withConfiguration: cfg)
            imageView.tintColor = theme.outgoingStatusColor
        case .read:
            imageView.image     = UIImage(systemName: "checkmark.circle.fill", withConfiguration: cfg)
            imageView.tintColor = theme.outgoingStatusReadColor
        }
    }
}

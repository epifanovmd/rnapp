//
// ChatLayout
// StatusView.swift
// https://github.com/ekazaev/ChatLayout
//
// Created by Eugene Kazaev in 2020-2026.
// Distributed under the MIT license.
//
// Become a sponsor:
// https://github.com/sponsors/ekazaev
//

import Foundation
import UIKit

final class StatusView: UIView, StaticViewFactory {
    private lazy var imageView = UIImageView(frame: bounds)

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupSubviews()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupSubviews()
    }

    private func setupSubviews() {
        translatesAutoresizingMaskIntoConstraints = false
        insetsLayoutMarginsFromSafeArea = false
        layoutMargins = .zero
        addSubview(imageView)

        imageView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            imageView.leadingAnchor.constraint(equalTo: layoutMarginsGuide.leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: layoutMarginsGuide.trailingAnchor),
            imageView.topAnchor.constraint(equalTo: layoutMarginsGuide.topAnchor),
            imageView.bottomAnchor.constraint(equalTo: layoutMarginsGuide.bottomAnchor)
        ])
        let widthConstraint = imageView.widthAnchor.constraint(equalToConstant: 15)
        widthConstraint.priority = UILayoutPriority(rawValue: 999)
        widthConstraint.isActive = true
        let heightConstraint = imageView.heightAnchor.constraint(equalToConstant: 15)
        heightConstraint.priority = UILayoutPriority(rawValue: 999)
        heightConstraint.isActive = true

        imageView.contentMode = .center
    }

    func setup(with status: MessageStatus, configuration: ChatConfiguration) {
        switch status {
        case .sent:
            imageView.image = configuration.statusIcons.sent
            imageView.tintColor = configuration.colors.statusSent
        case .received:
            imageView.image = configuration.statusIcons.received
            imageView.tintColor = configuration.colors.statusReceived
        case .read:
            imageView.image = configuration.statusIcons.read
            imageView.tintColor = configuration.colors.statusRead
        }
    }
}

//
// CustomMessageView.swift
// chat-ios
//
// Created by Andrei on 17.01.2026.
//

import Foundation
import UIKit

final class CustomMessageView: UIView, ContainerCollectionViewCellDelegate {
    private let label = UILabel()
    private var configuration: ChatConfiguration?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    func apply(text: String, configuration: ChatConfiguration, isIncoming: Bool) {
        self.configuration = configuration
        label.text = text
        label.textColor = isIncoming ? configuration.colors.incomingText : configuration.colors.outgoingText
        label.font = configuration.fonts.message
    }

    private func setupView() {
        translatesAutoresizingMaskIntoConstraints = false
        insetsLayoutMarginsFromSafeArea = false
        layoutMargins = .zero
        addSubview(label)
        label.translatesAutoresizingMaskIntoConstraints = false
        label.numberOfLines = 0
        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: layoutMarginsGuide.topAnchor),
            label.bottomAnchor.constraint(equalTo: layoutMarginsGuide.bottomAnchor),
            label.leadingAnchor.constraint(equalTo: layoutMarginsGuide.leadingAnchor),
            label.trailingAnchor.constraint(equalTo: layoutMarginsGuide.trailingAnchor)
        ])
    }
}

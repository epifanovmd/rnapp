//
// SystemMessageView.swift
// chat-ios
//
// Created by Andrei on 17.01.2026.
//

import UIKit

final class SystemMessageView: UIView {
    private let label = UILabel()
    private let backgroundView = UIView()

    var highlightTargetView: UIView {
        backgroundView
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    func apply(text: String, configuration: ChatConfiguration) {
        label.text = text
        label.font = configuration.fonts.systemMessage
        label.textColor = configuration.colors.systemMessageText
        backgroundView.backgroundColor = configuration.colors.systemMessageBackground
        backgroundView.layer.borderColor = configuration.colors.systemMessageBorder.cgColor
        backgroundView.layer.borderWidth = 1
        backgroundView.layer.cornerRadius = 10
        layoutMargins = configuration.layout.systemMessageInsets
    }

    private func setupView() {
        translatesAutoresizingMaskIntoConstraints = false
        insetsLayoutMarginsFromSafeArea = false
        layoutMargins = .zero

        backgroundView.translatesAutoresizingMaskIntoConstraints = false
        backgroundView.clipsToBounds = true
        addSubview(backgroundView)

        label.translatesAutoresizingMaskIntoConstraints = false
        label.numberOfLines = 0
        label.textAlignment = .center
        backgroundView.addSubview(label)

        NSLayoutConstraint.activate([
            backgroundView.topAnchor.constraint(equalTo: layoutMarginsGuide.topAnchor),
            backgroundView.bottomAnchor.constraint(equalTo: layoutMarginsGuide.bottomAnchor),
            backgroundView.leadingAnchor.constraint(equalTo: layoutMarginsGuide.leadingAnchor),
            backgroundView.trailingAnchor.constraint(equalTo: layoutMarginsGuide.trailingAnchor),

            label.topAnchor.constraint(equalTo: backgroundView.topAnchor, constant: 6),
            label.bottomAnchor.constraint(equalTo: backgroundView.bottomAnchor, constant: -6),
            label.leadingAnchor.constraint(equalTo: backgroundView.leadingAnchor, constant: 10),
            label.trailingAnchor.constraint(equalTo: backgroundView.trailingAnchor, constant: -10)
        ])
    }
}

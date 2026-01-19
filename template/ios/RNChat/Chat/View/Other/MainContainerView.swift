//
// ChatLayout
// MainContainerView.swift
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

final class MainContainerView<LeadingAccessory: StaticViewFactory, CustomView: UIView, TrailingAccessory: StaticViewFactory>: UIView {
    var swipeCompletionRate: CGFloat = 0 {
        didSet {
            updateOffsets()
        }
    }

    var avatarView: LeadingAccessory.View? {
        containerView.leadingView
    }

    var customView: BezierMaskedView<CustomView> {
        containerView.customView
    }

    var statusView: TrailingAccessory.View? {
        containerView.trailingView
    }

    private(set) lazy var containerView = CellLayoutContainerView<LeadingAccessory, BezierMaskedView<CustomView>, TrailingAccessory>()

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
        clipsToBounds = false
        addSubview(containerView)
        NSLayoutConstraint.activate([
            containerView.leadingAnchor.constraint(equalTo: layoutMarginsGuide.leadingAnchor),
            containerView.trailingAnchor.constraint(equalTo: layoutMarginsGuide.trailingAnchor),
            containerView.topAnchor.constraint(equalTo: layoutMarginsGuide.topAnchor),
            containerView.bottomAnchor.constraint(equalTo: layoutMarginsGuide.bottomAnchor)
        ])

        updateOffsets()
    }

    private func updateOffsets() {
        if let avatarView,
           !avatarView.isHidden {
            avatarView.transform = CGAffineTransform(translationX: -((avatarView.bounds.width) * swipeCompletionRate), y: 0)
        }
        switch containerView.customView.messageType {
        case .incoming:
            customView.transform = .identity
            customView.transform = CGAffineTransform(translationX: -(customView.frame.origin.x * swipeCompletionRate), y: 0)
        case .outgoing:
            customView.transform = .identity

        }

    }
}

//
// ChatLayout
// ImageController.swift
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

final class ImageController {
    weak var view: ImageView? {
        didSet {
            UIView.performWithoutAnimation {
                view?.reloadData()
            }
        }
    }

    var onReload: ((UUID) -> Void)?

    var state: ImageViewState {
        guard let image else {
            return .loading
        }
        return .image(image)
    }

    private var image: UIImage?

    private let messageId: UUID

    private let source: ImageMessageSource

    init(source: ImageMessageSource, messageId: UUID) {
        self.source = source
        self.messageId = messageId
        loadImage()
    }

    private func loadImage() {
        switch source {
        case let .imageURL(url):
            if let image = try? imageCache.getEntity(for: .init(url: url)) {
                self.image = image
                view?.reloadData()
            } else {
                loader.loadImage(from: url) { [weak self] result in
                    guard let self,
                          case let .success(image) = result else {
                        return
                    }
            
                        self.image = image
                        view?.reloadData()
               
                        onReload?(messageId)
               
                }
            }
        case let .image(image):
            self.image = image
            view?.reloadData()
        }
    }
}

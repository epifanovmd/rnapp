//
// ChatLayout
// AvatarViewController.swift
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

final class AvatarViewController {
    var image: UIImage? {
        cachedImage
    }

    private let user: ChatUser

    private let bubble: Cell.BubbleType
    
    private let configuration: ChatConfiguration
    
    private var cachedImage: UIImage?

    weak var view: AvatarView? {
        didSet {
            view?.apply(configuration: configuration)
            view?.reloadData()
        }
    }

    init(user: ChatUser, bubble: Cell.BubbleType, configuration: ChatConfiguration) {
        self.user = user
        self.bubble = bubble
        self.configuration = configuration
        loadAvatar()
    }
    
    private func loadAvatar() {
        guard configuration.behavior.showsAvatars else {
            cachedImage = nil
            return
        }
        guard let avatar = user.avatar else {
            cachedImage = nil
            return
        }
        switch avatar {
        case let .image(image):
            cachedImage = image
            view?.reloadData()
        case let .imageURL(url):
            if let image = try? imageCache.getEntity(for: .init(url: url)) {
                cachedImage = image
                view?.reloadData()
            } else {
                loader.loadImage(from: url) { [weak self] result in
                    guard let self,
                          case let .success(image) = result else {
                        return
                    }
                    self.cachedImage = image
                    self.view?.reloadData()
                }
            }
        }
    }
}

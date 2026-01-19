//
// ChatLayout
// TextMessageController.swift
// https://github.com/ekazaev/ChatLayout
//
// Created by Eugene Kazaev in 2020-2026.
// Distributed under the MIT license.
//
// Become a sponsor:
// https://github.com/sponsors/ekazaev
//

import Foundation

final class TextMessageController {
    weak var view: TextMessageView? {
        didSet {
            view?.reloadData()
        }
    }

    let text: String
    let type: MessageType

    init(text: String, type: MessageType) {
        self.text = text
        self.type = type

    }
}

//
// ChatLayout
// RawMessage.swift
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

struct RawMessage: Hashable {
    enum Data: Hashable {
        case text(String)
        case image(ImageMessageSource)
        case system(String)
    }

    var id: UUID
    var date: Date
    var data: Data
    var user: ChatUser
    var direction: MessageType?
    var status: MessageStatus = .sent
    var replyToId: UUID? = nil
}

extension RawMessage.Data {
    var isSystem: Bool {
        if case .system = self {
            return true
        }
        return false
    }
}

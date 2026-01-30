//
// ChatLayout
// Message.swift
// https://github.com/ekazaev/ChatLayout
//
// Created by Eugene Kazaev in 2020-2026.
// Distributed under the MIT license.
//
// Become a sponsor:
// https://github.com/sponsors/ekazaev
//

import DifferenceKit
import Foundation

enum MessageType: Hashable {
    case incoming

    case outgoing

    var isIncoming: Bool {
        self == .incoming
    }
}

enum MessageStatus: Hashable {
    case sent

    case received

    case read
}

extension ChatItemAlignment {
    var isIncoming: Bool {
        self == .leading
    }
}

struct DateGroup: Hashable {
    var id: UUID

    var date: Date

    var title: String

    init(id: UUID, date: Date, title: String) {
        self.id = id
        self.date = date
        self.title = title
    }
}

extension DateGroup: Differentiable {
    var differenceIdentifier: Int {
        hashValue
    }

    func isContentEqual(to source: DateGroup) -> Bool {
        self == source
    }
}

struct ReplyPreview: Hashable {
    var id: UUID
    var senderName: String
    var text: String
    var data: RawMessage.Data
    var type: MessageType
}

struct SystemMessage: Hashable {
    var id: UUID
    var date: Date
    var text: String
}

struct Message: Hashable {
    enum Data: Hashable {
        case text(String)
        case image(ImageMessageSource, isLocallyStored: Bool)
    }

    var id: UUID

    var date: Date

    var data: Data

    var owner: ChatUser

    var type: MessageType

    var status: MessageStatus = .sent

    var showsHeader: Bool = false

    var replyPreview: ReplyPreview? = nil
}

extension Message: Differentiable {
    var differenceIdentifier: Int {
        id.hashValue
    }

    func isContentEqual(to source: Message) -> Bool {
        self == source
    }
}

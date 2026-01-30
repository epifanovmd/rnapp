//
// ChatLayout
// Cell.swift
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
import UIKit

enum Cell: Hashable {
    enum BubbleType {
        case normal
        case tailed
    }

    case message(Message, bubbleType: BubbleType)

    case date(DateGroup)

    case system(SystemMessage)

    var alignment: ChatItemAlignment {
        switch self {
        case let .message(message, _):
            message.type == .incoming ? .leading : .trailing
        case .date:
            .center
        case .system:
            .center
        }
    }
}

extension Cell: Differentiable {
    var differenceIdentifier: Int {
        switch self {
        case let .message(message, _):
            message.differenceIdentifier
        case let .date(group):
            group.differenceIdentifier
        case let .system(message):
            message.id.hashValue
        }
    }

    func isContentEqual(to source: Cell) -> Bool {
        self == source
    }
}

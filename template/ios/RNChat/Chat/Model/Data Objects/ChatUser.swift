//
// ChatUser.swift
// chat-ios
//
// Created by Andrei on 17.01.2026.
//

import Foundation
import UIKit

struct ChatUser: Hashable {
    var id: Int
    var displayName: String
    var avatar: ImageMessageSource?

    init(id: Int, displayName: String, avatar: ImageMessageSource? = nil) {
        self.id = id
        self.displayName = displayName
        self.avatar = avatar
    }
}

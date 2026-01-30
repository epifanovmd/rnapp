//
// ChatUser.swift
// chat-ios
//
// Created by Andrei on 17.01.2026.
//

import Foundation

struct ChatUser: Hashable {
    var id: Int
    var displayName: String

    init(id: Int, displayName: String) {
        self.id = id
        self.displayName = displayName
    }
}

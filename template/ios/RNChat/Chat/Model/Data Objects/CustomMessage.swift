//
// CustomMessage.swift
// chat-ios
//
// Created by Andrei on 17.01.2026.
//

import Foundation

struct CustomMessage: Hashable {
    var kind: String
    var payload: AnyHashable?

    init(kind: String, payload: AnyHashable? = nil) {
        self.kind = kind
        self.payload = payload
    }
}

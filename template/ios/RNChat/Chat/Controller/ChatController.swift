//
// ChatLayout
// ChatController.swift
// https://github.com/ekazaev/ChatLayout
//
// Created by Eugene Kazaev in 2020-2026.
// Distributed under the MIT license.
//
// Become a sponsor:
// https://github.com/sponsors/ekazaev
//

import Foundation

protocol ChatController: AnyObject {
    var userId: Int? { get set }
    var configuration: ChatConfiguration { get set }
    // Вызывается из React Native
    func setMessages(_ rawMessages: [RawMessage])
    func setMessages(_ rawMessages: [RawMessage], _ animated: Bool)
    func appendMessages(_ rawMessages: [RawMessage])
    func appendMessages(_ rawMessages: [RawMessage], _ animated: Bool)
    func deleteMessage(with id: UUID)
    func markMessagesAsRead(ids: [UUID])
    func markMessagesAsReceived(ids: [UUID])
    
    // Внутренние методы для UI
    func reloadMessage(with id: UUID)
}

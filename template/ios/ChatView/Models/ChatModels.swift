// MARK: - ChatModels.swift
// Core data models for ChatView component

import Foundation
import UIKit

// MARK: - Message Status

enum MessageStatus: String {
    case sending = "sending"
    case sent = "sent"
    case delivered = "delivered"
    case read = "read"
}

// MARK: - Message Types

enum MessageContentType: String {
    case text = "text"
    case image = "image"
    case mixed = "mixed"
}

// MARK: - Message Content Protocol

protocol MessageContent {
    var type: MessageContentType { get }
}

struct TextContent: MessageContent {
    let type: MessageContentType = .text
    let text: String
}

struct ImageContent: MessageContent {
    let type: MessageContentType = .image
    let url: String
    let width: CGFloat?
    let height: CGFloat?
    let thumbnailUrl: String?
}

// MARK: - Reply Message (lightweight reference)

struct ReplyReference {
    let id: String
    let text: String?
    let senderName: String?
    let hasImages: Bool
}

// MARK: - Chat Message

struct ChatMessage: Identifiable {
    let id: String
    let text: String?
    let images: [ImageContent]?
    let timestamp: Date
    let senderName: String?
    let isMine: Bool
    let groupDate: String // YYYY-MM-DD for grouping
    let status: MessageStatus
    let replyTo: ReplyReference?

    // Computed
    var hasText: Bool { !(text?.isEmpty ?? true) }
    var hasImages: Bool { !(images?.isEmpty ?? true) }

    var contentTypes: [MessageContentType] {
        var types: [MessageContentType] = []
        if hasText { types.append(.text) }
        if hasImages { types.append(.image) }
        return types
    }
}

// MARK: - Context Menu Action

struct MessageAction {
    let id: String
    let title: String
    let systemImage: String?
    let isDestructive: Bool
}

// MARK: - Section Model

struct MessageSection {
    let dateString: String      // Human-readable: "Today", "Yesterday", "Jan 15"
    let dateKey: String         // YYYY-MM-DD for sorting
    var messages: [ChatMessage]
}

// MARK: - Collection View Item Types

enum ChatItemType {
    case message(ChatMessage)
    case dateSeparator(String) // dateKey
}

// MARK: - Parsing from JS Props

extension ChatMessage {
    static func from(dict: [String: Any]) -> ChatMessage? {
        guard let id = dict["id"] as? String,
              let timestampMs = dict["timestamp"] as? Double else {
            return nil
        }

        let timestamp = Date(timeIntervalSince1970: timestampMs / 1000)
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let groupDate = dateFormatter.string(from: timestamp)

        let images: [ImageContent]? = (dict["images"] as? [[String: Any]])?.compactMap { imgDict in
            guard let url = imgDict["url"] as? String else { return nil }
            return ImageContent(
                url: url,
                width: imgDict["width"] as? CGFloat,
                height: imgDict["height"] as? CGFloat,
                thumbnailUrl: imgDict["thumbnailUrl"] as? String
            )
        }

        let statusRaw = dict["status"] as? String ?? "sent"
        let status = MessageStatus(rawValue: statusRaw) ?? .sent

        var replyTo: ReplyReference? = nil
        if let replyDict = dict["replyTo"] as? [String: Any],
           let replyId = replyDict["id"] as? String {
            replyTo = ReplyReference(
                id: replyId,
                text: replyDict["text"] as? String,
                senderName: replyDict["senderName"] as? String,
                hasImages: (replyDict["hasImages"] as? Bool) ?? false
            )
        }

        return ChatMessage(
            id: id,
            text: dict["text"] as? String,
            images: images?.isEmpty == false ? images : nil,
            timestamp: timestamp,
            senderName: dict["senderName"] as? String,
            isMine: dict["isMine"] as? Bool ?? false,
            groupDate: groupDate,
            status: status,
            replyTo: replyTo
        )
    }
}

extension MessageAction {
    static func from(dict: [String: Any]) -> MessageAction? {
        guard let id = dict["id"] as? String,
              let title = dict["title"] as? String else {
            return nil
        }
        return MessageAction(
            id: id,
            title: title,
            systemImage: dict["systemImage"] as? String,
            isDestructive: dict["isDestructive"] as? Bool ?? false
        )
    }
}

// MARK: - Date Formatting Helpers

struct DateHelper {
    static let shared = DateHelper()

    private let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f
    }()

    private let sectionFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .none
        return f
    }()

    func timeString(from date: Date) -> String {
        timeFormatter.string(from: date)
    }

    func sectionTitle(from dateKey: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: dateKey) else { return dateKey }

        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "Today" }
        if calendar.isDateInYesterday(date) { return "Yesterday" }

        let components = calendar.dateComponents([.day], from: date, to: Date())
        if let days = components.day, days < 7 {
            let weekFormatter = DateFormatter()
            weekFormatter.dateFormat = "EEEE"
            return weekFormatter.string(from: date)
        }

        return sectionFormatter.string(from: date)
    }
}

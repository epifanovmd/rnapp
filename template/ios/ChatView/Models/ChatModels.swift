// MARK: - ChatModels.swift

import Foundation
import UIKit

// MARK: - MessageStatus

enum MessageStatus: String {
    case sending   = "sending"
    case sent      = "sent"
    case delivered = "delivered"
    case read      = "read"
}

// MARK: - MessageContent
//
// Sealed hierarchy типов контента. Каждый case самодостаточен.
//
// Добавление нового типа сообщения:
//   1. Добавить case + вложенный Payload struct
//   2. Добавить MessageContentView реализацию в MessageContentViews.swift
//   3. Добавить case в MessageContentViewFactory.make(for:)
//   4. Добавить case в MessageSizeCalculator.contentHeight(for:bubbleWidth:)
//   Всё остальное — Cell, BubbleView, Cache, DataSource — не трогать.

enum MessageContent {
    case text(TextPayload)
    case images(ImagesPayload)
    case mixed(TextPayload, ImagesPayload)

    struct TextPayload {
        let body: String
    }

    struct ImagesPayload {
        let items: [ImageItem]

        struct ImageItem {
            let url:          String
            let width:        CGFloat?
            let height:       CGFloat?
            let thumbnailUrl: String?
        }
    }

    // MARK: Computed shortcuts

    var text: String? {
        switch self {
        case .text(let p):     return p.body
        case .mixed(let p, _): return p.body
        case .images:          return nil
        }
    }

    var images: [ImagesPayload.ImageItem]? {
        switch self {
        case .images(let p):   return p.items
        case .mixed(_, let p): return p.items
        case .text:            return nil
        }
    }

    var hasText:   Bool { text   != nil }
    var hasImages: Bool { images != nil }
}

// MARK: - MessageContent: Equatable
// Fix #12: Equatable позволяет DiffableDataSource точно определять изменения
// без полного пересчёта snapshot.

extension MessageContent: Equatable {
    static func == (lhs: MessageContent, rhs: MessageContent) -> Bool {
        switch (lhs, rhs) {
        case (.text(let l), .text(let r)):
            return l.body == r.body
        case (.images(let l), .images(let r)):
            return l.items.map(\.url) == r.items.map(\.url)
        case (.mixed(let lt, let li), .mixed(let rt, let ri)):
            return lt.body == rt.body && li.items.map(\.url) == ri.items.map(\.url)
        default:
            return false
        }
    }
}

// MARK: - ReplyPreviewData
//
// Хранит только replyToId. Актуальный контент цитаты резолвится в рантайме
// через messageIndex в ChatViewController. Это значит:
//   • Удаление оригинала автоматически скрывает превью (без патча модели)
//   • Размер ячейки зависит от того, существует ли ID в текущем списке
//   • JS передаёт полный словарь replyTo, но мы берём только id

struct ReplyPreviewData {
    let replyToId: String
}

// MARK: - ResolvedReply
//
// Результат резолвинга цитаты — передаётся прямо в MessageBubbleView.

enum ResolvedReply {
    case found(Snapshot)
    case deleted           // оригинал удалён → пузырь без превью

    struct Snapshot {
        let id:         String
        let text:       String?
        let senderName: String?
        let hasImages:  Bool
    }
}

// MARK: - ChatMessage

struct ChatMessage: Identifiable {
    let id:         String
    let content:    MessageContent
    let timestamp:  Date
    let senderName: String?
    let isMine:     Bool
    let groupDate:  String         // "yyyy-MM-dd" для группировки по дням
    let status:     MessageStatus
    let reply:      ReplyPreviewData?  // nil = нет цитаты

    // Удобные алиасы
    var text:       String?                          { content.text }
    var images:     [MessageContent.ImagesPayload.ImageItem]? { content.images }
    var hasText:    Bool                             { content.hasText }
    var hasImages:  Bool                             { content.hasImages }
    var replyToId:  String?                          { reply?.replyToId }
}

// MARK: - ChatMessage: Equatable
// Fix #12: Используется в updateMessages для точного вычисления changedIDs
// и позволяет избежать лишних reconfigureItems.

extension ChatMessage: Equatable {
    static func == (lhs: ChatMessage, rhs: ChatMessage) -> Bool {
        lhs.id      == rhs.id      &&
        lhs.status  == rhs.status  &&
        lhs.content == rhs.content
    }
}

// MARK: - MessageAction

struct MessageAction {
    let id:            String
    let title:         String
    let systemImage:   String?
    let isDestructive: Bool
}

// MARK: - MessageSection

struct MessageSection {
    let dateString: String   // "Сегодня", "Вчера", "15 янв."
    let dateKey:    String   // "yyyy-MM-dd"
    var messages:   [ChatMessage]
}

// MARK: - Parsing from JS bridge

private let groupDateFormatter: DateFormatter = {
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd"
    return f
}()

extension ChatMessage {
    static func from(dict: [String: Any]) -> ChatMessage? {
        guard
            let id          = dict["id"] as? String,
            let timestampMs = dict["timestamp"] as? Double
        else { return nil }

        let timestamp  = Date(timeIntervalSince1970: timestampMs / 1000)
        let groupDate  = groupDateFormatter.string(from: timestamp)
        let status     = MessageStatus(rawValue: dict["status"] as? String ?? "") ?? .sent
        let isMine     = dict["isMine"] as? Bool ?? false
        let senderName = dict["senderName"] as? String

        let textBody = dict["text"] as? String
        let imageItems = (dict["images"] as? [[String: Any]])?.compactMap {
            d -> MessageContent.ImagesPayload.ImageItem? in
            guard let url = d["url"] as? String else { return nil }
            return .init(url: url,
                         width:        d["width"]        as? CGFloat,
                         height:       d["height"]       as? CGFloat,
                         thumbnailUrl: d["thumbnailUrl"] as? String)
        }.nilIfEmpty

        let content: MessageContent
        switch (textBody, imageItems) {
        case let (t?, imgs?): content = .mixed(.init(body: t), .init(items: imgs))
        case let (t?, nil):   content = .text(.init(body: t))
        case let (nil, imgs?):content = .images(.init(items: imgs))
        default: return nil
        }

        var reply: ReplyPreviewData?
        if let rd = dict["replyTo"] as? [String: Any], let rid = rd["id"] as? String {
            reply = ReplyPreviewData(replyToId: rid)
        }

        return ChatMessage(id: id, content: content, timestamp: timestamp,
                           senderName: senderName, isMine: isMine,
                           groupDate: groupDate, status: status, reply: reply)
    }
}

extension MessageAction {
    static func from(dict: [String: Any]) -> MessageAction? {
        guard let id = dict["id"] as? String, let title = dict["title"] as? String
        else { return nil }
        return MessageAction(id: id, title: title,
                             systemImage:   dict["systemImage"]   as? String,
                             isDestructive: dict["isDestructive"] as? Bool ?? false)
    }
}

private extension Array {
    var nilIfEmpty: Self? { isEmpty ? nil : self }
}

// MARK: - DateHelper

struct DateHelper {
    static let shared = DateHelper()

    private let timeFormatter: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "HH:mm"; return f
    }()
    private let sectionFormatter: DateFormatter = {
        let f = DateFormatter(); f.dateStyle = .medium; f.timeStyle = .none; return f
    }()
    private let groupParser: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f
    }()
    // Fix #9: weekdayFormatter создавался при каждом вызове sectionTitle.
    // DateFormatter — один из самых дорогих объектов в Foundation,
    // создание на main thread во время layout вызывает фризы.
    private let weekdayFormatter: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "EEEE"; return f
    }()

    func timeString(from date: Date) -> String { timeFormatter.string(from: date) }

    func sectionTitle(from dateKey: String) -> String {
        guard let date = groupParser.date(from: dateKey) else { return dateKey }
        let cal = Calendar.current
        if cal.isDateInToday(date)     { return "Сегодня" }
        if cal.isDateInYesterday(date) { return "Вчера" }
        if let d = cal.dateComponents([.day], from: date, to: Date()).day, d < 7 {
            return weekdayFormatter.string(from: date)
        }
        return sectionFormatter.string(from: date)
    }
}

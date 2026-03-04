// MARK: - ChatModels.swift
// Доменные модели чата. Единственная точка истины для всех структур данных.
//
// Добавление нового типа контента:
//   1. Добавить case в MessageContent + вложенный Payload
//   2. Реализовать MessageContentView в MessageContentViews.swift
//   3. Добавить case в MessageContentViewFactory
//   4. Добавить case в MessageSizeCalculator.contentHeight(for:bubbleWidth:)

import Foundation

// MARK: - MessageStatus

enum MessageStatus: String {
    case sending   = "sending"
    case sent      = "sent"
    case delivered = "delivered"
    case read      = "read"
}

// MARK: - MessageContent

/// Версионированный sealed-тип контента сообщения.
/// Каждый case самодостаточен и несёт все данные для рендера.
enum MessageContent {
    case text(TextPayload)
    case image(ImagePayload)       // одна картинка (упрощено от grid)
    case mixed(TextPayload, ImagePayload)

    // MARK: Payloads

    struct TextPayload: Equatable {
        let body: String
    }

    struct ImagePayload: Equatable {
        let url:          String
        let width:        CGFloat?
        let height:       CGFloat?
        let thumbnailUrl: String?
    }

    // MARK: Convenience accessors

    /// Текстовое тело сообщения (nil для чисто-фото).
    var text: String? {
        switch self {
        case .text(let p):     return p.body
        case .mixed(let p, _): return p.body
        case .image:           return nil
        }
    }

    /// Изображение сообщения (nil для чисто-текстовых).
    var image: ImagePayload? {
        switch self {
        case .image(let p):   return p
        case .mixed(_, let p): return p
        case .text:            return nil
        }
    }

    var hasText:  Bool { text  != nil }
    var hasImage: Bool { image != nil }
}

extension MessageContent: Equatable {
    static func == (lhs: MessageContent, rhs: MessageContent) -> Bool {
        switch (lhs, rhs) {
        case (.text(let l),        .text(let r)):        return l == r
        case (.image(let l),       .image(let r)):       return l == r
        case (.mixed(let lt, let li), .mixed(let rt, let ri)):
            return lt == rt && li == ri
        default: return false
        }
    }
}

// MARK: - ReplyInfo
// Минимальные данные о цитируемом сообщении, хранящиеся внутри ChatMessage.

struct ReplyInfo: Equatable {
    let replyToId:  String
    let senderName: String?
    let text:       String?
    let hasImage:   Bool
}

// MARK: - ChatMessage

struct ChatMessage: Identifiable, Equatable {
    let id:         String
    let content:    MessageContent
    let timestamp:  Date
    let senderName: String?
    let isMine:     Bool
    let groupDate:  String      // "yyyy-MM-dd" — ключ секции
    let status:     MessageStatus
    let reply:      ReplyInfo?  // nil если сообщение не является ответом

    // MARK: Convenience shortcuts

    var text:      String?          { content.text }
    var image:     MessageContent.ImagePayload? { content.image }
    var hasText:   Bool             { content.hasText }
    var hasImage:  Bool             { content.hasImage }
    var replyToId: String?          { reply?.replyToId }
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
    let dateKey:  String          // "yyyy-MM-dd" — идентификатор секции
    var messages: [ChatMessage]
}

// MARK: - ResolvedReply
// Результат разрешения ссылки на цитируемое сообщение в текущем messageIndex.

enum ResolvedReply {
    /// Оригинал найден в индексе.
    case found(ReplyInfo)
    /// Оригинал был удалён.
    case deleted
}

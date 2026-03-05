// MARK: - ChatModels.swift
// Доменные модели чата. Единственная точка истины для всех структур данных.
//
// Добавление нового типа контента:
//   1. Добавить case в MessageContent + вложенный Payload
//   2. Реализовать MessageContentView в MessageContentViews.swift
//   3. Добавить case в MessageContentViewFactory
//   4. Добавить case в MessageSizeCalculator.contentHeight(for:bubbleWidth:)
//
// Reply-архитектура:
//   • ChatMessage.reply (ReplyInfo) — неизменяемый снапшот момента отправки.
//     Хранит replyToId + данные как они были в момент ответа.
//   • ResolvedReply — результат резолвинга в рантайме через messageIndex.
//     .found содержит АКТУАЛЬНЫЕ данные оригинала из messageIndex,
//     поэтому при редактировании оригинала цитата автоматически обновляется.
//   • ReplyInfo.staticSnapshot используется только как fallback когда
//     оригинал удалён (.deleted).

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
    case image(ImagePayload)
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

    var text: String? {
        switch self {
        case .text(let p):     return p.body
        case .mixed(let p, _): return p.body
        case .image:           return nil
        }
    }

    var image: ImagePayload? {
        switch self {
        case .image(let p):    return p
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
        case (.text(let l),           .text(let r)):        return l == r
        case (.image(let l),          .image(let r)):       return l == r
        case (.mixed(let lt, let li), .mixed(let rt, let ri)):
            return lt == rt && li == ri
        default: return false
        }
    }
}

// MARK: - ReplyInfo
//
// Хранит ТОЛЬКО ссылку (replyToId) плюс снапшот данных в момент ответа.
// Снапшот нужен исключительно для случая .deleted — когда оригинал удалён
// и показать актуальные данные невозможно.
// При рендере живого сообщения данные берутся из messageIndex (см. ResolvedReply).

struct ReplyInfo: Equatable {
    let replyToId:       String
    /// Данные оригинала в момент создания ответа (fallback для deleted).
    let senderName:      String?
    let text:            String?
    let hasImage:        Bool
}

// MARK: - ChatMessage

struct ChatMessage: Identifiable, Equatable {
    let id:         String
    let content:    MessageContent
    let timestamp:  Date
    let senderName: String?
    let isMine:     Bool
    let groupDate:  String
    let status:     MessageStatus
    let reply:      ReplyInfo?
    let isEdited:   Bool

    // MARK: Convenience

    var text:      String?                      { content.text }
    var image:     MessageContent.ImagePayload? { content.image }
    var hasText:   Bool                         { content.hasText }
    var hasImage:  Bool                         { content.hasImage }
    var replyToId: String?                      { reply?.replyToId }
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
    let dateKey:  String          // "yyyy-MM-dd"
    var messages: [ChatMessage]
}

// MARK: - ResolvedReply
//
// Результат резолвинга ссылки на оригинал сообщения.
// Используется исключительно на уровне рендера (MessageBubbleView).
// Резолвинг происходит в ChatViewController.resolve(_:) каждый раз при
// конфигурации ячейки — это гарантирует что цитата всегда отражает
// актуальное состояние оригинала (после редактирования).

enum ResolvedReply {
    /// Оригинал найден — несёт АКТУАЛЬНЫЕ данные из messageIndex.
    case found(ReplyDisplayInfo)
    /// Оригинал удалён — показываем заглушку.
    case deleted
}

// MARK: - ReplyDisplayInfo
//
// Данные для рендера цитаты. Строится из ЖИВОГО ChatMessage в messageIndex,
// а не из снапшота ReplyInfo. Благодаря этому редактирование оригинала
// мгновенно отражается во всех ссылающихся на него ячейках.

struct ReplyDisplayInfo: Equatable {
    let replyToId:  String
    let senderName: String?
    let text:       String?
    let hasImage:   Bool

    /// Строит ReplyDisplayInfo из актуального ChatMessage (источник — messageIndex).
    init(from message: ChatMessage) {
        replyToId  = message.id
        senderName = message.senderName
        text       = message.text
        hasImage   = message.hasImage
    }

    /// Строит ReplyDisplayInfo из снапшота для случая deleted (fallback).
    init(fromSnapshot info: ReplyInfo) {
        replyToId  = info.replyToId
        senderName = info.senderName
        text       = info.text
        hasImage   = info.hasImage
    }
}

// MARK: - ChatParsing.swift
// Парсинг словарей из JS-bridge в доменные модели.
// Намеренно изолирован от ChatModels.swift:
// модели не знают о мосте, мост не знает о деталях рендера.

import Foundation

// MARK: - GroupDate formatter (file-private, единственный экземпляр)

private let groupDateFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale     = Locale(identifier: "en_US_POSIX")   // стабильный парсинг ключей
    f.dateFormat = "yyyy-MM-dd"
    return f
}()

// MARK: - ChatMessage + JS parsing

extension ChatMessage {

    /// Создаёт ChatMessage из словаря React Native bridge.
    /// Возвращает nil если отсутствуют обязательные поля (id, timestamp).
    static func from(dict: [String: Any]) -> ChatMessage? {
        guard
            let id          = dict["id"] as? String,
            let timestampMs = dict["timestamp"] as? Double
        else { return nil }

        let timestamp  = Date(timeIntervalSince1970: timestampMs / 1_000)
        let groupDate  = groupDateFormatter.string(from: timestamp)
        let status     = MessageStatus(rawValue: dict["status"] as? String ?? "") ?? .sent
        let isMine     = dict["isMine"]    as? Bool ?? false
        let senderName = dict["senderName"] as? String
        let isEdited   = dict["isEdited"]  as? Bool ?? false

        // Парсинг контента — text и/или image (первое изображение из массива)
        let textBody  = (dict["text"] as? String).flatMap { $0.isEmpty ? nil : $0 }
        let imageItem = (dict["images"] as? [[String: Any]])?.first.flatMap {
            MessageContent.ImagePayload.from(dict: $0)
        }

        let content: MessageContent
        switch (textBody, imageItem) {
        case let (t?, img?): content = .mixed(.init(body: t), img)
        case let (t?, nil):  content = .text(.init(body: t))
        case let (nil, img?): content = .image(img)
        default: return nil
        }

        // Парсинг цитаты
        let reply: ReplyInfo? = (dict["replyTo"] as? [String: Any]).flatMap {
            ReplyInfo.from(dict: $0)
        }

        return ChatMessage(
            id:         id,
            content:    content,
            timestamp:  timestamp,
            senderName: senderName,
            isMine:     isMine,
            groupDate:  groupDate,
            status:     status,
            reply:      reply,
            isEdited:   isEdited
        )
    }
}

// MARK: - MessageContent.ImagePayload + JS parsing

extension MessageContent.ImagePayload {

    static func from(dict: [String: Any]) -> MessageContent.ImagePayload? {
        guard let url = dict["url"] as? String, !url.isEmpty else { return nil }
        return MessageContent.ImagePayload(
            url:          url,
            width:        dict["width"]        as? CGFloat,
            height:       dict["height"]       as? CGFloat,
            thumbnailUrl: dict["thumbnailUrl"] as? String
        )
    }
}

// MARK: - ReplyInfo + JS parsing

extension ReplyInfo {

    static func from(dict: [String: Any]) -> ReplyInfo? {
        guard let id = dict["id"] as? String, !id.isEmpty else { return nil }
        return ReplyInfo(
            replyToId:  id,
            senderName: dict["senderName"] as? String,
            text:       dict["text"]       as? String,
            hasImage:   dict["hasImages"]  as? Bool ?? false
        )
    }
}

// MARK: - MessageAction + JS parsing

extension MessageAction {

    static func from(dict: [String: Any]) -> MessageAction? {
        guard
            let id    = dict["id"]    as? String,
            let title = dict["title"] as? String
        else { return nil }

        return MessageAction(
            id:            id,
            title:         title,
            systemImage:   dict["systemImage"]   as? String,
            isDestructive: dict["isDestructive"] as? Bool ?? false
        )
    }
}

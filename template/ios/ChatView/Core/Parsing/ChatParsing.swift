// MARK: - ChatParsing.swift
// Парсинг словарей из JS-bridge в доменные модели.

import Foundation

// MARK: - GroupDate formatter (file-private, единственный экземпляр)

private let groupDateFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale     = Locale(identifier: "en_US_POSIX")
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

        // Парсинг контента — text, image, video, poll, file
        let textBody  = (dict["text"] as? String).flatMap { $0.isEmpty ? nil : $0 }
        let imageItem = (dict["images"] as? [[String: Any]])?.first.flatMap {
            MessageContent.ImagePayload.from(dict: $0)
        }
        let videoItem = (dict["video"] as? [String: Any]).flatMap {
            MessageContent.VideoPayload.from(dict: $0)
        }
        let pollItem = (dict["poll"] as? [String: Any]).flatMap {
            MessageContent.PollPayload.from(dict: $0)
        }
        let fileItem = (dict["file"] as? [String: Any]).flatMap {
            MessageContent.FilePayload.from(dict: $0)
        }

        // Приоритет: poll > file > video > image > text
        let content: MessageContent
        if let poll = pollItem {
            content = .poll(poll)
        } else if let file = fileItem {
            content = .file(file)
        } else if let video = videoItem {
            if let t = textBody {
                content = .mixedTextVideo(.init(body: t), video)
            } else {
                content = .video(video)
            }
        } else {
            switch (textBody, imageItem) {
            case let (t?, img?): content = .mixed(.init(body: t), img)
            case let (t?, nil):  content = .text(.init(body: t))
            case let (nil, img?): content = .image(img)
            default: return nil
            }
        }

        let reply: ReplyInfo? = (dict["replyTo"] as? [String: Any]).flatMap {
            ReplyInfo.from(dict: $0)
        }

        let actions: [MessageAction] = (dict["actions"] as? [[String: Any]] ?? [])
            .compactMap { MessageAction.from(dict: $0) }

        return ChatMessage(
            id:         id,
            content:    content,
            timestamp:  timestamp,
            senderName: senderName,
            isMine:     isMine,
            groupDate:  groupDate,
            status:     status,
            reply:      reply,
            isEdited:   isEdited,
            actions:    actions
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

// MARK: - MessageContent.VideoPayload + JS parsing

extension MessageContent.VideoPayload {

    static func from(dict: [String: Any]) -> MessageContent.VideoPayload? {
        guard let url = dict["url"] as? String, !url.isEmpty else { return nil }
        return MessageContent.VideoPayload(
            url:          url,
            thumbnailUrl: dict["thumbnailUrl"] as? String,
            width:        dict["width"]        as? CGFloat,
            height:       dict["height"]       as? CGFloat,
            duration:     dict["duration"]     as? TimeInterval
        )
    }
}

// MARK: - MessageContent.PollPayload + JS parsing

extension MessageContent.PollPayload {

    static func from(dict: [String: Any]) -> MessageContent.PollPayload? {
        guard
            let id       = dict["id"]       as? String,
            let question = dict["question"] as? String,
            let optArr   = dict["options"]  as? [[String: Any]]
        else { return nil }

        let options = optArr.compactMap { MessageContent.PollOption.from(dict: $0) }
        guard !options.isEmpty else { return nil }

        return MessageContent.PollPayload(
            id:               id,
            question:         question,
            options:          options,
            totalVotes:       Int(dict["totalVotes"] as? Double ?? 0),
            selectedOptionId: dict["selectedOptionId"] as? String,
            isClosed:         dict["isClosed"] as? Bool ?? false
        )
    }
}

extension MessageContent.PollOption {

    static func from(dict: [String: Any]) -> MessageContent.PollOption? {
        guard
            let id   = dict["id"]   as? String,
            let text = dict["text"] as? String
        else { return nil }
        return MessageContent.PollOption(
            id:         id,
            text:       text,
            votes:      Int(dict["votes"]      as? Double ?? 0),
            percentage: CGFloat(dict["percentage"] as? Double ?? 0)
        )
    }
}

// MARK: - MessageContent.FilePayload + JS parsing

extension MessageContent.FilePayload {

    static func from(dict: [String: Any]) -> MessageContent.FilePayload? {
        guard
            let url  = dict["url"]  as? String, !url.isEmpty,
            let name = dict["name"] as? String, !name.isEmpty
        else { return nil }
        return MessageContent.FilePayload(
            url:      url,
            name:     name,
            size:     Int64(dict["size"] as? Double ?? 0),
            mimeType: dict["mimeType"] as? String
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

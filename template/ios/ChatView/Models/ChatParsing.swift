import Foundation

// MARK: - ChatMessage Parsing

extension ChatMessage {
    static func from(dict: NSDictionary) -> ChatMessage? {
        guard let id = dict["id"] as? String,
              let ts = dict["timestamp"] as? Double else { return nil }

        let text = dict["text"] as? String
        let senderName = dict["senderName"] as? String
        let isMine = dict["isMine"] as? Bool ?? false
        let statusStr = dict["status"] as? String ?? "sent"
        let forwardedFrom = dict["forwardedFrom"] as? String
        let isEdited = dict["isEdited"] as? Bool ?? false

        let status = MessageStatus(rawValue: statusStr) ?? .sent
        let date = Date(timeIntervalSince1970: ts / 1000)

        let content = parseContent(dict: dict, text: text)
        let reactions = parseReactions(dict["reactions"] as? [NSDictionary])
        let reply = parseReply(dict["replyTo"] as? NSDictionary)
        let actions = parseActions(dict["actions"] as? [NSDictionary])
        let groupDate = ChatParsing.groupDateFormatter.string(from: date)

        return ChatMessage(
            id: id,
            content: content,
            timestamp: date,
            senderName: senderName,
            isMine: isMine,
            groupDate: groupDate,
            status: status,
            reply: reply,
            forwardedFrom: forwardedFrom,
            reactions: reactions,
            isEdited: isEdited,
            actions: actions
        )
    }

    private static func parseContent(dict: NSDictionary, text: String?) -> MessageContent {
        if let pollDict = dict["poll"] as? NSDictionary {
            return .poll(parsePoll(pollDict))
        }
        if let fileDict = dict["file"] as? NSDictionary {
            return .file(parseFile(fileDict))
        }
        if let voiceDict = dict["voice"] as? NSDictionary {
            return .voice(parseVoice(voiceDict))
        }
        if let videoDict = dict["video"] as? NSDictionary {
            let video = parseVideo(videoDict)
            if let t = text, !t.isEmpty {
                return .mixedTextVideo(TextPayload(text: t), video)
            }
            return .video(video)
        }
        if let imagesArr = dict["images"] as? [NSDictionary], !imagesArr.isEmpty {
            let images = ImagePayload(images: imagesArr.compactMap(parseImageItem))
            if let t = text, !t.isEmpty {
                return .mixed(TextPayload(text: t), images)
            }
            return .image(images)
        }
        return .text(TextPayload(text: text ?? ""))
    }

    private static func parseImageItem(_ dict: NSDictionary) -> ImageItem? {
        guard let url = dict["url"] as? String else { return nil }
        return ImageItem(
            url: url,
            width: (dict["width"] as? NSNumber)?.cgFloatValue,
            height: (dict["height"] as? NSNumber)?.cgFloatValue,
            thumbnailUrl: dict["thumbnailUrl"] as? String
        )
    }

    private static func parseVideo(_ dict: NSDictionary) -> VideoPayload {
        VideoPayload(
            url: dict["url"] as? String ?? "",
            thumbnailUrl: dict["thumbnailUrl"] as? String,
            width: (dict["width"] as? NSNumber)?.cgFloatValue,
            height: (dict["height"] as? NSNumber)?.cgFloatValue,
            duration: dict["duration"] as? TimeInterval
        )
    }

    private static func parseVoice(_ dict: NSDictionary) -> VoicePayload {
        let waveform = (dict["waveform"] as? [NSNumber])?.map { $0.floatValue } ?? []
        return VoicePayload(
            url: dict["url"] as? String ?? "",
            duration: dict["duration"] as? TimeInterval ?? 0,
            waveform: waveform
        )
    }

    private static func parsePoll(_ dict: NSDictionary) -> PollPayload {
        let options = (dict["options"] as? [NSDictionary] ?? []).compactMap { o -> PollOption? in
            guard let id = o["id"] as? String, let text = o["text"] as? String else { return nil }
            return PollOption(
                id: id, text: text,
                votes: (o["votes"] as? NSNumber)?.intValue ?? 0,
                percentage: CGFloat((o["percentage"] as? NSNumber)?.floatValue ?? 0)
            )
        }
        return PollPayload(
            id: dict["id"] as? String ?? "",
            question: dict["question"] as? String ?? "",
            options: options,
            totalVotes: (dict["totalVotes"] as? NSNumber)?.intValue ?? 0,
            selectedOptionIds: dict["selectedOptionIds"] as? [String] ?? [],
            isMultipleChoice: dict["isMultipleChoice"] as? Bool ?? false,
            isClosed: dict["isClosed"] as? Bool ?? false
        )
    }

    private static func parseFile(_ dict: NSDictionary) -> FilePayload {
        FilePayload(
            url: dict["url"] as? String ?? "",
            name: dict["name"] as? String ?? "File",
            size: (dict["size"] as? NSNumber)?.int64Value ?? 0,
            mimeType: dict["mimeType"] as? String
        )
    }

    private static func parseReactions(_ arr: [NSDictionary]?) -> [Reaction] {
        arr?.compactMap { dict in
            guard let emoji = dict["emoji"] as? String else { return nil }
            return Reaction(
                emoji: emoji,
                count: (dict["count"] as? NSNumber)?.intValue ?? 0,
                isMine: dict["isMine"] as? Bool ?? false
            )
        } ?? []
    }

    private static func parseReply(_ dict: NSDictionary?) -> ReplyInfo? {
        guard let dict, let id = dict["id"] as? String else { return nil }
        return ReplyInfo(
            replyToId: id,
            senderName: dict["senderName"] as? String,
            text: dict["text"] as? String,
            hasImage: dict["hasImages"] as? Bool ?? false
        )
    }

    private static func parseActions(_ arr: [NSDictionary]?) -> [MessageAction] {
        arr?.compactMap { dict in
            guard let id = dict["id"] as? String, let title = dict["title"] as? String else { return nil }
            return MessageAction(
                id: id, title: title,
                systemImage: dict["systemImage"] as? String,
                isDestructive: dict["isDestructive"] as? Bool ?? false
            )
        } ?? []
    }
}

// MARK: - Group Date Formatter

enum ChatParsing {
    static let groupDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
}

// MARK: - NSNumber convenience

private extension NSNumber {
    var cgFloatValue: CGFloat { CGFloat(doubleValue) }
}

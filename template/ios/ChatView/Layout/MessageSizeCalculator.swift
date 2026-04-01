// MARK: - MessageSizeCalculator.swift
// Stateless калькулятор размеров ячеек.

import UIKit

enum MessageSizeCalculator {

    // MARK: - Public API

    static func cellSize(
        for message: ChatMessage,
        hasReply: Bool,
        collectionViewWidth: CGFloat
    ) -> CGSize {
        let maxBubble = floor(collectionViewWidth * ChatLayoutConstants.bubbleMaxWidthRatio)
        let bw = bubbleWidth(for: message, hasReply: hasReply, maxWidth: maxBubble)
        let bh = bubbleHeight(for: message, hasReply: hasReply, bubbleWidth: bw)
        return CGSize(
            width:  collectionViewWidth,
            height: max(
                ceil(bh) + ChatLayoutConstants.cellVerticalPadding,
                ChatLayoutConstants.minimumCellHeight
            )
        )
    }

    // MARK: - Bubble width

    static func bubbleWidth(
        for message: ChatMessage,
        hasReply: Bool,
        maxWidth: CGFloat
    ) -> CGFloat {
        // Emoji-only: без пузыря, ширина по размеру текста
        if let count = emojiOnlyCount(for: message), !hasReply {
            let font = EmojiHelper.font(forCount: count)
            let w = ceil((message.text! as NSString).size(withAttributes: [.font: font]).width)
            return min(w + ChatLayoutConstants.bubbleHorizontalPad, maxWidth)
        }
        // Media, replies, polls, files — max width
        if message.content.hasMedia || hasReply || message.content.hasPoll || message.content.hasFile {
            return maxWidth
        }
        let minW = minimumBubbleWidth(for: message)
        guard let text = message.text else { return minW }
        let natural   = naturalTextWidth(for: text)
        let candidate = ceil(natural) + ChatLayoutConstants.bubbleHorizontalPad
        return min(max(candidate, minW), maxWidth)
    }

    // MARK: - Bubble height

    static func bubbleHeight(
        for message: ChatMessage,
        hasReply: Bool,
        bubbleWidth: CGFloat
    ) -> CGFloat {
        // Emoji-only: без footer
        if let count = emojiOnlyCount(for: message), !hasReply {
            let font = EmojiHelper.font(forCount: count)
            let h = ceil((message.text! as NSString).size(withAttributes: [.font: font]).height)
            return h + ChatLayoutConstants.emojiOnlyExtraH
        }

        var h = ChatLayoutConstants.bubbleTopPad

        if hasReply {
            h += ChatLayoutConstants.replyBlockHeight + ChatLayoutConstants.stackSpacing
        }

        h += contentHeight(for: message.content, bubbleWidth: bubbleWidth)
        h += ChatLayoutConstants.footerTopSpacing
           + ChatLayoutConstants.footerHeight
           + ChatLayoutConstants.bubbleBottomPad

        return h
    }

    // MARK: - Content height dispatch

    static func contentHeight(for content: MessageContent, bubbleWidth: CGFloat) -> CGFloat {
        let inner = bubbleWidth - ChatLayoutConstants.bubbleHorizontalPad
        switch content {
        case .text(let p):
            // Emoji-only обрабатывается в bubbleHeight, тут обычный текст
            if let count = EmojiHelper.emojiOnlyCount(p.body) {
                let font = EmojiHelper.font(forCount: count)
                return ceil((p.body as NSString).size(withAttributes: [.font: font]).height)
                    + ChatLayoutConstants.stackSpacing
            }
            return textHeight(p.body, width: inner) + ChatLayoutConstants.stackSpacing

        case .image:
            return imageHeight(width: inner) + ChatLayoutConstants.stackSpacing

        case .mixed(let tp, _):
            return imageHeight(width: inner)
                 + ChatLayoutConstants.stackSpacing
                 + textHeight(tp.body, width: inner)
                 + ChatLayoutConstants.stackSpacing

        case .video:
            return imageHeight(width: inner) + ChatLayoutConstants.stackSpacing

        case .mixedTextVideo(let tp, _):
            return imageHeight(width: inner)
                 + ChatLayoutConstants.stackSpacing
                 + textHeight(tp.body, width: inner)
                 + ChatLayoutConstants.stackSpacing

        case .poll(let p):
            return pollHeight(p, width: inner)

        case .file:
            return ChatLayoutConstants.fileRowHeight + ChatLayoutConstants.stackSpacing
        }
    }

    // MARK: - Minimum width

    static func minimumBubbleWidth(for message: ChatMessage) -> CGFloat {
        let timeText = DateHelper.shared.timeString(from: message.timestamp)
        let timeW = ceil((timeText as NSString).size(
            withAttributes: [.font: ChatLayoutConstants.footerFont]).width)

        let statusW: CGFloat = message.isMine
            ? ChatLayoutConstants.footerInternalSpacing + ChatLayoutConstants.statusIconWidth
            : 0

        let editedW: CGFloat = message.isEdited
            ? MessageSizeCalculator.editedLabelWidth
                + ChatLayoutConstants.footerInternalSpacing
            : 0

        return timeW + statusW + editedW + ChatLayoutConstants.footerTrailingPad * 2
    }

    // MARK: - Edited label width (cached)

    private static let editedLabelWidth: CGFloat = {
        let text = NSLocalizedString(
            "chat.bubble.edited",
            value: "edited",
            comment: "Short label shown in message footer when a message has been edited"
        )
        return ceil((text as NSString).size(
            withAttributes: [.font: ChatLayoutConstants.footerFont]).width)
    }()

    // MARK: - Helpers

    static func imageHeight(width: CGFloat) -> CGFloat {
        width * ChatLayoutConstants.imageAspectRatio
    }

    /// Проверяет, является ли сообщение emoji-only.
    static func emojiOnlyCount(for message: ChatMessage) -> Int? {
        guard case .text(let p) = message.content else { return nil }
        return EmojiHelper.emojiOnlyCount(p.body)
    }

    private static func naturalTextWidth(for text: String) -> CGFloat {
        ceil((text as NSString).boundingRect(
            with: CGSize(width: 10_000, height: CGFloat.greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: [.font: ChatLayoutConstants.messageFont],
            context: nil
        ).width)
    }

    private static func textHeight(_ text: String, width: CGFloat) -> CGFloat {
        guard width > 0 else { return 0 }
        return ceil((text as NSString).boundingRect(
            with: CGSize(width: width, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: [.font: ChatLayoutConstants.messageFont],
            context: nil
        ).height)
    }

    private static func pollHeight(_ poll: MessageContent.PollPayload, width: CGFloat) -> CGFloat {
        // Question height
        let qH = ceil((poll.question as NSString).boundingRect(
            with: CGSize(width: width, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: [.font: ChatLayoutConstants.pollQuestionFont],
            context: nil
        ).height)

        // Option rows
        let optionsH = CGFloat(poll.options.count) * ChatLayoutConstants.pollBarHeight
        let optionsSpacing = CGFloat(poll.options.count) * ChatLayoutConstants.pollSpacing

        // Total votes label
        let votesH: CGFloat = 18

        return qH + ChatLayoutConstants.pollSpacing
             + optionsH + optionsSpacing
             + votesH + ChatLayoutConstants.stackSpacing
    }
}

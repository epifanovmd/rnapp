import UIKit

enum MessageSizeCalculator {

    // MARK: - Public

    static func cellHeight(for msg: ChatMessage, maxWidth: CGFloat, resolvedReply: ReplyDisplayInfo?, showSenderName: Bool = false) -> CGFloat {
        let bw = bubbleWidth(for: msg, containerWidth: maxWidth, showSenderName: showSenderName)
        let bh = bubbleHeight(for: msg, bubbleWidth: bw, resolvedReply: resolvedReply, showSenderName: showSenderName)
        return bh + ChatLayout.cellVSpacing
    }

    // MARK: - Bubble Width

    static func bubbleWidth(for msg: ChatMessage, containerWidth: CGFloat, showSenderName: Bool = false) -> CGFloat {
        let maxW = containerWidth * ChatLayout.bubbleMaxWidthRatio
        let content = msg.content

        if !content.hasMedia, let count = EmojiHelper.emojiOnlyCount(content.text) {
            let font = emojiFont(for: count)
            let tw = textWidth(content.text!, font: font)
            return min(tw + ChatLayout.bubbleHPad * 2, maxW)
        }

        // Minimum width from sender name
        var senderNameW: CGFloat = 0
        if showSenderName, let name = msg.senderName, !msg.isMine {
            senderNameW = textWidth(name, font: ChatLayout.senderNameFont) + ChatLayout.bubbleHPad * 2
        }

        // Any media → max width
        if content.hasMedia {
            return maxW
        }

        // Text-only
        if let text = content.text {
            let tw = textWidth(text, font: ChatLayout.messageFont)
            let minW = minFooterWidth(for: msg)
            let contentW = max(tw + ChatLayout.bubbleHPad * 2, minW + ChatLayout.bubbleHPad * 2)
            return min(max(contentW, senderNameW), maxW)
        }

        return max(ChatLayout.bubbleMinWidth, senderNameW)
    }

    // MARK: - Bubble Height

    static func bubbleHeight(for msg: ChatMessage, bubbleWidth bw: CGFloat, resolvedReply: ReplyDisplayInfo?, showSenderName: Bool = false) -> CGFloat {
        let content = msg.content

        if !content.hasMedia, let count = EmojiHelper.emojiOnlyCount(content.text) {
            let font = emojiFont(for: count)
            return textHeight(content.text!, font: font, width: bw - ChatLayout.bubbleHPad * 2) + 8
        }

        let innerW = bw - ChatLayout.bubbleHPad * 2
        var h: CGFloat = ChatLayout.bubbleVPad

        if showSenderName, msg.senderName != nil, !msg.isMine {
            h += ChatLayout.senderNameFont.lineHeight + 2
        }
        if msg.forwardedFrom != nil {
            h += ChatLayout.forwardedFont.lineHeight + 2
        }
        if msg.reply != nil {
            h += ChatLayout.replyHeight + 4
        }

        h += contentHeight(for: content, width: innerW)

        if !msg.reactions.isEmpty {
            h += ChatLayout.reactionChipHeight + 4
        }

        h += ChatLayout.footerHeight + ChatLayout.bubbleBottomPad
        return h
    }

    // MARK: - Content Height

    static func contentHeight(for content: MessageContent, width: CGFloat) -> CGFloat {
        var h: CGFloat = 0

        // Media height (by priority, matching bubble view)
        if let poll = content.poll {
            h += pollHeight(poll, width: width)
        } else if let files = content.files, !files.isEmpty {
            let fileRowH = ChatLayout.fileIconSize + 8
            h += fileRowH * CGFloat(files.count) + 2 * CGFloat(max(0, files.count - 1))
        } else if content.voice != nil {
            h += ChatLayout.voiceWaveformHeight + ChatLayout.voicePlaySize / 2 + 8
        } else if let media = content.media, !media.isEmpty {
            h += MediaGridView.gridHeight(for: media, width: width)
        }

        // Text height (caption or standalone)
        if let text = content.text, !text.isEmpty {
            if h > 0 { h += 4 }
            h += textHeight(text, font: ChatLayout.messageFont, width: width)
        }

        return max(h, 0)
    }

    // MARK: - Helpers

    static func pollHeight(_ poll: PollPayload, width: CGFloat) -> CGFloat {
        var h: CGFloat = textHeight(poll.question, font: ChatLayout.pollQuestionFont, width: width) + 8
        h += CGFloat(poll.options.count) * (ChatLayout.pollBarHeight + ChatLayout.pollOptionSpacing)
        h += ChatLayout.pollVotesFont.lineHeight + 4
        return h
    }

    static func textHeight(_ text: String, font: UIFont, width: CGFloat) -> CGFloat {
        let size = (text as NSString).boundingRect(
            with: CGSize(width: width, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: [.font: font],
            context: nil
        ).size
        return ceil(size.height)
    }

    static func textWidth(_ text: String, font: UIFont) -> CGFloat {
        let size = (text as NSString).boundingRect(
            with: CGSize(width: CGFloat.greatestFiniteMagnitude, height: font.lineHeight),
            options: [.usesLineFragmentOrigin],
            attributes: [.font: font],
            context: nil
        ).size
        return ceil(size.width)
    }

    static func minFooterWidth(for msg: ChatMessage) -> CGFloat {
        var w = textWidth(DateHelper.shared.timeString(from: msg.timestamp), font: ChatLayout.timeFont)
        if msg.isMine { w += ChatLayout.statusIconSize + ChatLayout.footerSpacing }
        if msg.isEdited { w += textWidth("edited", font: ChatLayout.editedFont) + ChatLayout.footerSpacing }
        return w + ChatLayout.footerSpacing * 2
    }

    static func emojiFont(for count: Int) -> UIFont {
        switch count {
        case 1: return ChatLayout.emojiFont1
        case 2: return ChatLayout.emojiFont2
        default: return ChatLayout.emojiFont3
        }
    }
}

// MARK: - Emoji Helper

enum EmojiHelper {
    static func emojiOnlyCount(_ text: String?) -> Int? {
        guard let text, !text.isEmpty else { return nil }
        let scalars = text.unicodeScalars
        let stripped = scalars.filter { !$0.properties.isJoinControl && !$0.properties.isVariationSelector && $0.value != 0xFE0F }
        guard stripped.allSatisfy({ $0.properties.isEmoji && $0.properties.isEmojiPresentation || $0.properties.isEmojiModifier || $0.value == 0x200D }) else { return nil }
        let count = text.count
        guard count >= 1 && count <= 3 else { return nil }
        return count
    }
}

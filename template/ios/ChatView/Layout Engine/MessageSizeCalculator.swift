// MARK: - MessageSizeCalculator.swift
// Чистый stateless калькулятор. Без UIKit layout, без side-эффектов.

import UIKit

enum MessageSizeCalculator {

    // MARK: - Public API

    static func cellSize(for message: ChatMessage,
                         hasReply: Bool,
                         collectionViewWidth: CGFloat) -> CGSize {
        let maxBubble = floor(collectionViewWidth * ChatLayoutConstants.bubbleMaxWidthRatio)
        let bw = bubbleWidth(for: message, hasReply: hasReply, maxWidth: maxBubble)
        let bh = bubbleHeight(for: message, hasReply: hasReply, bubbleWidth: bw)
        return CGSize(
            width:  collectionViewWidth,
            height: max(ceil(bh) + ChatLayoutConstants.cellVerticalPadding,
                        ChatLayoutConstants.minimumCellHeight)
        )
    }

    // MARK: - Bubble width

    static func bubbleWidth(for message: ChatMessage,
                            hasReply: Bool,
                            maxWidth: CGFloat) -> CGFloat {
        // Изображения и цитаты всегда занимают полную ширину
        if message.hasImages || hasReply { return maxWidth }

        let minW = minimumBubbleWidth(for: message)
        guard let text = message.text else { return minW }

        let natural   = naturalTextWidth(for: text)
        let candidate = ceil(natural) + ChatLayoutConstants.bubbleHorizontalPad
        return min(max(candidate, minW), maxWidth)
    }

    // MARK: - Bubble height

    static func bubbleHeight(for message: ChatMessage,
                             hasReply: Bool,
                             bubbleWidth: CGFloat) -> CGFloat {
        var h = ChatLayoutConstants.bubbleTopPad

        if hasReply {
            h += ChatLayoutConstants.replyBubbleHeight + ChatLayoutConstants.stackSpacing
        }

        h += contentHeight(for: message.content, bubbleWidth: bubbleWidth)
        h += ChatLayoutConstants.footerTopSpacing
             + ChatLayoutConstants.footerHeight
             + ChatLayoutConstants.bubbleBottomPad

        return h
    }

    // MARK: - Content height dispatch
    //
    // Единственное место где нужно добавить case при введении нового типа.

    static func contentHeight(for content: MessageContent, bubbleWidth: CGFloat) -> CGFloat {
        let inner = bubbleWidth - ChatLayoutConstants.bubbleHorizontalPad
        switch content {
        case .text(let p):
            return textHeight(p.body, width: inner) + ChatLayoutConstants.stackSpacing

        case .images(let p):
            return imageGridHeight(count: p.items.count, width: inner)
                   + ChatLayoutConstants.stackSpacing

        case .mixed(let tp, let ip):
            return imageGridHeight(count: ip.items.count, width: inner)
                   + ChatLayoutConstants.stackSpacing
                   + textHeight(tp.body, width: inner)
                   + ChatLayoutConstants.stackSpacing
        }
    }

    // MARK: - Minimum width (footer must not clip)

    static func minimumBubbleWidth(for message: ChatMessage) -> CGFloat {
        let timeText = DateHelper.shared.timeString(from: message.timestamp)
        let timeW = ceil((timeText as NSString).size(
            withAttributes: [.font: ChatLayoutConstants.footerFont]).width)
        let statusW: CGFloat = message.isMine
            ? ChatLayoutConstants.footerInternalSpacing + ChatLayoutConstants.statusIconWidth
            : 0
        return timeW + statusW + ChatLayoutConstants.footerTrailingPad * 2
    }

    // MARK: - Helpers

    static func imageGridHeight(count: Int, width: CGFloat) -> CGFloat {
        width * (count == 1 ? 0.6 : 0.5)
    }

    private static func naturalTextWidth(for text: String) -> CGFloat {
        ceil((text as NSString).boundingRect(
            with: CGSize(width: 10_000, height: CGFloat.greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: [.font: ChatLayoutConstants.messageFont], context: nil).width)
    }

    private static func textHeight(_ text: String, width: CGFloat) -> CGFloat {
        guard width > 0 else { return 0 }
        return ceil((text as NSString).boundingRect(
            with: CGSize(width: width, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: [.font: ChatLayoutConstants.messageFont], context: nil).height)
    }
}

// MARK: - MessageSizeCalculator.swift
// Stateless калькулятор размеров ячеек.
// Не зависит от UIKit layout, не имеет side-эффектов.
// Все вычисления детерминированы — одинаковый input → одинаковый output.

import UIKit

enum MessageSizeCalculator {

    // MARK: - Public API

    /// Возвращает итоговый CGSize ячейки для CollectionView.
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

    /// Вычисляет точную ширину пузыря.
    /// Изображения и сообщения с цитатой всегда получают максимальную ширину.
    static func bubbleWidth(
        for message: ChatMessage,
        hasReply: Bool,
        maxWidth: CGFloat
    ) -> CGFloat {
        if message.hasImage || hasReply { return maxWidth }

        let minW = minimumBubbleWidth(for: message)
        guard let text = message.text else { return minW }

        let natural   = naturalTextWidth(for: text)
        let candidate = ceil(natural) + ChatLayoutConstants.bubbleHorizontalPad
        return min(max(candidate, minW), maxWidth)
    }

    // MARK: - Bubble height

    /// Суммирует высоты всех компонентов пузыря сверху вниз.
    static func bubbleHeight(
        for message: ChatMessage,
        hasReply: Bool,
        bubbleWidth: CGFloat
    ) -> CGFloat {
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
    // Единственное место, требующее изменений при добавлении нового типа.

    static func contentHeight(for content: MessageContent, bubbleWidth: CGFloat) -> CGFloat {
        let inner = bubbleWidth - ChatLayoutConstants.bubbleHorizontalPad
        switch content {
        case .text(let p):
            return textHeight(p.body, width: inner) + ChatLayoutConstants.stackSpacing

        case .image:
            return imageHeight(width: inner) + ChatLayoutConstants.stackSpacing

        case .mixed(let tp, _):
            return imageHeight(width: inner)
                 + ChatLayoutConstants.stackSpacing
                 + textHeight(tp.body, width: inner)
                 + ChatLayoutConstants.stackSpacing
        }
    }

    // MARK: - Minimum width (footer must never clip)

    /// Минимальная ширина пузыря, при которой footer не обрезается.
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

    /// Ширина строки «edited» при шрифте footer — вычисляется один раз.
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

    /// Высота одиночного изображения по фиксированному ratio.
    static func imageHeight(width: CGFloat) -> CGFloat {
        width * ChatLayoutConstants.imageAspectRatio
    }

    /// Натуральная (однострочная) ширина текста без переносов.
    private static func naturalTextWidth(for text: String) -> CGFloat {
        ceil((text as NSString).boundingRect(
            with: CGSize(width: 10_000, height: CGFloat.greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: [.font: ChatLayoutConstants.messageFont],
            context: nil
        ).width)
    }

    /// Высота многострочного текста при заданной ширине.
    private static func textHeight(_ text: String, width: CGFloat) -> CGFloat {
        guard width > 0 else { return 0 }
        return ceil((text as NSString).boundingRect(
            with: CGSize(width: width, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: [.font: ChatLayoutConstants.messageFont],
            context: nil
        ).height)
    }
}

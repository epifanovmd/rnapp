// MARK: - ChatLayoutConstants.swift
// Единый источник истины для всех размерных констант чата.
// И MessageSizeCalculator (чистая математика), и Auto Layout ограничения
// ссылаются на одни и те же значения — визуальный результат и кэш всегда совпадают.

import UIKit

enum ChatLayoutConstants {

    // MARK: - Ячейка

    /// Суммарный вертикальный отступ внутри ячейки (сверху 2 + снизу 2).
    static let cellVerticalPadding: CGFloat = 4
    /// Горизонтальный зазор между краем пузыря и краем коллекции.
    static let cellSideMargin: CGFloat      = 8
    /// Минимальная высота ячейки.
    static let minimumCellHeight: CGFloat   = 36

    // MARK: - Форма пузыря

    /// Радиус скругления всех углов.
    static let bubbleCornerRadius: CGFloat  = 16

    // MARK: - Размеры пузыря

    /// Максимальная ширина пузыря как доля ширины экрана.
    static let bubbleMaxWidthRatio: CGFloat = 0.78
    /// Суммарный горизонтальный внутренний отступ (leading 10 + trailing 10).
    static let bubbleHorizontalPad: CGFloat = 20
    static let bubbleTopPad: CGFloat        = 6
    static let bubbleBottomPad: CGFloat     = 5

    // MARK: - Стек контента

    static let stackSpacing: CGFloat        = 3

    // MARK: - Превью ответа (фиксированная высота внутри пузыря)

    static let replyBubbleHeight: CGFloat   = 46

    // MARK: - Подпись (время + статус)

    static let footerHeight: CGFloat        = 15
    static let footerTopSpacing: CGFloat    = 2
    /// Отступ footer-стека от правого края пузыря.
    static let footerTrailingPad: CGFloat   = 8
    static let footerInternalSpacing: CGFloat = 3
    static let statusIconWidth: CGFloat     = 13

    // MARK: - Шрифты

    static let messageFont  = UIFont.systemFont(ofSize: 15)
    static let footerFont   = UIFont.systemFont(ofSize: 11, weight: .regular)

    // MARK: - Межсообщенческий отступ

    /// Вертикальный зазор между ячейками (minLineSpacing FlowLayout).
    static let lineSpacing: CGFloat         = 2

    // MARK: - InputBar

    /// Верхний/нижний отступ textView внутри containerView InputBar.
    static let inputBarVerticalPadding: CGFloat = 8
    /// Высота панели ответа в InputBar.
    static let inputBarReplyPanelHeight: CGFloat = 56
    /// Минимальная высота textView в InputBar.
    static let inputBarTextViewMinHeight: CGFloat = 36
    /// Максимальная высота textView в InputBar.
    static let inputBarTextViewMaxHeight: CGFloat = 120
}

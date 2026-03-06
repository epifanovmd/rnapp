// MARK: - ChatLayoutConstants.swift
// Единственная точка истины для всех размерных констант чата.
// MessageSizeCalculator (математика) и Auto Layout (рендер) используют
// одни и те же значения — визуальный результат всегда совпадает с кэшем.

import UIKit

enum ChatLayoutConstants {

    // MARK: - Cell

    /// Суммарный вертикальный отступ ячейки (2 сверху + 2 снизу).
    static let cellVerticalPadding:   CGFloat = 4
    /// Горизонтальный зазор между краем пузыря и краем коллекции.
    static let cellSideMargin:        CGFloat = 8
    /// Минимальная высота ячейки (защита от схлопывания).
    static let minimumCellHeight:     CGFloat = 36

    // MARK: - Bubble shape

    static let bubbleCornerRadius:    CGFloat = 16

    // MARK: - Bubble sizing

    /// Максимальная ширина пузыря как доля ширины коллекции.
    static let bubbleMaxWidthRatio:   CGFloat = 0.78
    /// Суммарный горизонтальный внутренний паддинг (leading 10 + trailing 10).
    static let bubbleHorizontalPad:   CGFloat = 20
    static let bubbleTopPad:          CGFloat = 6
    static let bubbleBottomPad:       CGFloat = 5

    // MARK: - Content stack

    static let stackSpacing:          CGFloat = 3

    // MARK: - Reply preview inside bubble

    /// Фиксированная высота блока цитаты внутри пузыря.
    static let replyBlockHeight:      CGFloat = 46

    // MARK: - Footer (time + status)

    static let footerHeight:          CGFloat = 15
    static let footerTopSpacing:      CGFloat = 2
    static let footerTrailingPad:     CGFloat = 8
    static let footerInternalSpacing: CGFloat = 3
    static let statusIconWidth:       CGFloat = 13
    static let statusIconHeight:      CGFloat = 13

    // MARK: - Image aspect ratio

    /// Высота одиночного изображения = ширина × ratio.
    static let imageAspectRatio:      CGFloat = 0.6

    // MARK: - Typography

    static let messageFont  = UIFont.systemFont(ofSize: 15)
    static let footerFont   = UIFont.systemFont(ofSize: 11, weight: .regular)

    // MARK: - Collection spacing

    /// Вертикальный зазор между ячейками (minLineSpacing).
    static let lineSpacing:             CGFloat = 2

    /// Верхний отступ контента коллекции (от шапки до первого сообщения).
    static let collectionTopPadding:    CGFloat = 8

    /// Дополнительный отступ снизу коллекции над InputBar.
    static let collectionBottomPadding: CGFloat = 16

    // MARK: - InputBar

    /// Верхний/нижний отступ textView внутри containerView.
    static let inputBarVerticalPadding:   CGFloat = 8
    /// Высота панели цитаты в InputBar.
    static let inputBarReplyPanelHeight:  CGFloat = 56
    /// Минимальная высота textView.
    static let inputBarTextViewMinHeight: CGFloat = 36
    /// Максимальная высота textView (после — включается скролл).
    static let inputBarTextViewMaxHeight: CGFloat = 120

    // MARK: - Shadows

    /// Тени пузыря сообщения в снапшоте контекстного меню.
    static let bubbleShadowOpacity: Float   = 0.16
    static let bubbleShadowRadius:  CGFloat = 10

    /// Тень кнопки FAB.
    static let fabShadowOpacity: Float   = 0.18
    static let fabShadowRadius:  CGFloat = 8
}

import UIKit

// MARK: - ContextMenuLayout

/// Результат расчёта всех позиций контекстного меню.
struct ContextMenuLayout {
    let snapTarget:    CGRect
    let emojiTarget:   CGRect
    let actionsTarget: CGRect
    let snapOrigin:    CGRect
    let emojiOrigin:   CGRect
    let actionsOrigin: CGRect
    let canvasSize:    CGSize
    let scrollOffset:  CGFloat
    let needsScroll:   Bool
}

// MARK: - ContextMenuLayoutEngine

/// Вычисляет позиции всех элементов контекстного меню.
/// Чистая функция без UIKit-состояния — легко тестируется.
enum ContextMenuLayoutEngine {

    /// Рассчитывает layout для заданных размеров и ограничений экрана.
    static func calculate(
        sourceFrame:  CGRect,
        snapSize:     CGSize,
        emojiSize:    CGSize,
        actionsSize:  CGSize,
        screen:       CGRect,
        safeArea:     UIEdgeInsets,
        theme:        ContextMenuTheme
    ) -> ContextMenuLayout {

        let hPad  = theme.horizontalPadding
        let vPad  = theme.verticalPadding
        let eGap  = theme.emojiPanelSpacing
        let mGap  = theme.menuSpacing

        let snapW  = snapSize.width
        let snapH  = snapSize.height
        let emojiW = min(emojiSize.width,  screen.width - hPad * 2)
        let emojiH = emojiSize.height
        let menuW  = min(actionsSize.width, screen.width - hPad * 2)
        let menuH  = actionsSize.height

        let topLimit    = safeArea.top    + vPad
        let bottomLimit = screen.height - safeArea.bottom - vPad

        let snapX  = clamp(sourceFrame.minX, lo: hPad, hi: screen.width - snapW  - hPad)
        let emojiX = clamp(snapX + snapW - emojiW, lo: hPad, hi: screen.width - emojiW - hPad)
        let menuX  = snapX + menuW > screen.width - hPad ? screen.width - hPad - menuW : snapX

        let totalH      = emojiH + eGap + snapH + mGap + menuH
        let needsScroll = totalH > bottomLimit - topLimit

        let emojiYc, snapYc, menuYc, canvasH, scrollOffset: CGFloat

        if needsScroll {
            emojiYc      = topLimit
            snapYc       = emojiYc + emojiH + eGap
            menuYc       = snapYc  + snapH  + mGap
            canvasH      = menuYc  + menuH  + safeArea.bottom + vPad
            scrollOffset = max(0, canvasH - screen.height)
        } else {
            let blockTop = clamp(sourceFrame.minY - emojiH - eGap, lo: topLimit, hi: bottomLimit - totalH)
            emojiYc      = blockTop
            snapYc       = emojiYc + emojiH + eGap
            menuYc       = snapYc  + snapH  + mGap
            canvasH      = screen.height
            scrollOffset = 0
        }

        let originY = sourceFrame.minY + scrollOffset

        return ContextMenuLayout(
            snapTarget:    CGRect(x: snapX,  y: snapYc,  width: snapW,  height: snapH),
            emojiTarget:   CGRect(x: emojiX, y: emojiYc, width: emojiW, height: emojiH),
            actionsTarget: CGRect(x: menuX,  y: menuYc,  width: menuW,  height: menuH),
            snapOrigin:    CGRect(x: sourceFrame.minX, y: originY,              width: snapW,  height: snapH),
            emojiOrigin:   CGRect(x: emojiX,           y: originY - eGap - emojiH, width: emojiW, height: emojiH),
            actionsOrigin: CGRect(x: menuX,            y: originY + snapH + mGap,  width: menuW,  height: menuH),
            canvasSize:    CGSize(width: screen.width, height: canvasH),
            scrollOffset:  scrollOffset,
            needsScroll:   needsScroll
        )
    }

    private static func clamp(_ v: CGFloat, lo: CGFloat, hi: CGFloat) -> CGFloat {
        max(lo, min(v, hi))
    }
}

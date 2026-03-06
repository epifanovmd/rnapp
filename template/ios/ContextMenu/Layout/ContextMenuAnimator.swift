import UIKit

// MARK: - ContextMenuAnimator

/// Управляет анимациями открытия и закрытия контекстного меню.
/// Работает только с переданными view и параметрами темы, не знает о бизнес-логике.
final class ContextMenuAnimator {

    private let theme:        ContextMenuTheme
    private let backdrop:     UIView
    private let snapshot:     UIView?
    private let emojiPanel:   UIView
    private let actionsPanel: UIView

    private static let openScale:  CGFloat = 0.5
    private static let closeScale: CGFloat = 0.5

    init(theme: ContextMenuTheme, backdrop: UIView, snapshot: UIView?,
         emojiPanel: UIView, actionsPanel: UIView) {
        self.theme        = theme
        self.backdrop     = backdrop
        self.snapshot     = snapshot
        self.emojiPanel   = emojiPanel
        self.actionsPanel = actionsPanel
    }

    /// Устанавливает начальное (до-анимационное) состояние всех элементов.
    /// Панели позиционируются вплотную к снапшоту в его стартовой позиции.
    func prepareOpen(layout: ContextMenuLayout) {
        snapshot?.frame = layout.snapOrigin
        place(emojiPanel,   in: layout.emojiOrigin,   scale: Self.openScale)
        place(actionsPanel, in: layout.actionsOrigin, scale: Self.openScale)
        emojiPanel.alpha   = 0
        actionsPanel.alpha = 0
        backdrop.alpha     = 0
    }

    /// Запускает spring-анимацию открытия: все элементы летят к целевым позициям единым блоком.
    func animateOpen(layout: ContextMenuLayout) {
        let dur = theme.openDuration
        let d   = theme.springDamping
        let v   = theme.springVelocity

        UIView.animate(withDuration: dur * 0.55, delay: 0, options: .curveEaseOut) { [weak self] in
            self?.backdrop.alpha = 1
        }

        UIView.animate(withDuration: dur, delay: 0,
                       usingSpringWithDamping: d, initialSpringVelocity: v,
                       options: .allowUserInteraction) { [weak self] in
            self?.snapshot?.frame = layout.snapTarget
        }

        animatePanel(actionsPanel, to: layout.actionsTarget, duration: dur, damping: d,        velocity: v)
        animatePanel(emojiPanel,   to: layout.emojiTarget,   duration: dur, damping: d - 0.1,  velocity: v)
    }

    /// Анимирует закрытие: элементы схлопываются к исходной позиции снапшота.
    func animateClose(returnFrame: CGRect, layout: ContextMenuLayout, completion: @escaping () -> Void) {
        let eGap = theme.emojiPanelSpacing
        let mGap = theme.menuSpacing
        let y    = returnFrame.minY

        let emojiClose   = layout.emojiTarget.at(y: y - layout.emojiTarget.height - eGap)
        let actionsClose = layout.actionsTarget.at(y: y + returnFrame.height + mGap)

        UIView.animate(withDuration: theme.closeDuration, delay: 0,
                       usingSpringWithDamping: 0.9, initialSpringVelocity: 0.2) { [weak self] in
            guard let self else { return }
            self.backdrop.alpha  = 0
            self.snapshot?.frame = returnFrame
            self.place(self.emojiPanel,   in: emojiClose,   scale: Self.closeScale)
            self.place(self.actionsPanel, in: actionsClose, scale: Self.closeScale)
            self.emojiPanel.alpha   = 0
            self.actionsPanel.alpha = 0
        } completion: { _ in completion() }
    }

    // MARK: - Private

    /// Позиционирует view через bounds + center + transform (не через frame).
    /// При scale != 1 frame является bounding-box трансформированного view и
    /// не пригоден для позиционирования — используем center который не зависит от transform.
    private func place(_ view: UIView, in rect: CGRect, scale: CGFloat) {
        view.bounds    = CGRect(origin: .zero, size: rect.size)
        view.center    = CGPoint(x: rect.midX, y: rect.midY)
        view.transform = scale == 1 ? .identity : CGAffineTransform(scaleX: scale, y: scale)
    }

    /// Анимирует панель к целевому rect: center → midX/midY, transform → .identity.
    private func animatePanel(_ panel: UIView, to target: CGRect,
                               duration: TimeInterval, damping: CGFloat, velocity: CGFloat) {
        UIView.animate(withDuration: duration, delay: 0,
                       usingSpringWithDamping: damping, initialSpringVelocity: velocity,
                       options: .allowUserInteraction) {
            panel.center    = CGPoint(x: target.midX, y: target.midY)
            panel.transform = .identity
            panel.alpha     = 1
        }
    }
}

// MARK: - CGRect helpers

private extension CGRect {
    /// Возвращает копию rect с изменённым minY (origin.y).
    func at(y: CGFloat) -> CGRect {
        CGRect(x: minX, y: y, width: width, height: height)
    }
}

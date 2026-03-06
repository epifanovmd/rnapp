// MARK: - ContextMenuViewController.swift
import UIKit

// MARK: - ContextMenuDelegate

public protocol ContextMenuDelegate: AnyObject {
    func contextMenu(_ menu: ContextMenuViewController, didSelectEmoji emoji: String, forId id: String)
    func contextMenu(_ menu: ContextMenuViewController, didSelectAction action: ContextMenuAction, forId id: String)
    func contextMenuDidDismiss(_ menu: ContextMenuViewController, id: String)
}

// MARK: - ContextMenuViewController

public final class ContextMenuViewController: UIViewController {

    public weak var delegate: ContextMenuDelegate?
    public private(set) var configuration: ContextMenuConfiguration
    public var theme: ContextMenuTheme { didSet { applyTheme() } }

    // MARK: State

    private var isDismissing     = false
    private var didPerformLayout = false
    private var sourceFrameInWindow: CGRect = .zero

    // Целевые фреймы в координатах view (не canvas)
    private var targetSnapFrame:    CGRect = .zero
    private var targetEmojiFrame:   CGRect = .zero
    private var targetActionsFrame: CGRect = .zero
    private var needsScroll = false

    // MARK: Views

    private let backdropBlur  = UIVisualEffectView()
    private let backdropColor = UIView()

    private let scrollView: UIScrollView = {
        let sv = UIScrollView()
        sv.showsVerticalScrollIndicator   = false
        sv.showsHorizontalScrollIndicator = false
        sv.contentInsetAdjustmentBehavior = .never
        sv.backgroundColor                = .clear
        sv.alwaysBounceVertical           = false
        sv.delaysContentTouches           = false
        sv.canCancelContentTouches        = true
        return sv
    }()

    private let canvas = UIView()

    private var snapshotView: UIView?
    private let emojiPanelView:  ContextMenuEmojiPanel
    private let actionsMenuView: ContextMenuActionsView

    // MARK: Init

    public init(configuration: ContextMenuConfiguration, theme: ContextMenuTheme = .light) {
        self.configuration   = configuration
        self.theme           = theme
        self.emojiPanelView  = ContextMenuEmojiPanel(theme: theme)
        self.actionsMenuView = ContextMenuActionsView(theme: theme)
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .overFullScreen
        modalTransitionStyle   = .crossDissolve

        let src = configuration.sourceView
        if let win = src.window {
            sourceFrameInWindow = src.convert(src.bounds, to: win)
        }
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: Lifecycle

    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear

        backdropBlur.effect = UIBlurEffect(style: theme.backdropBlurStyle)
        backdropBlur.alpha  = 0
        backdropBlur.frame  = view.bounds
        backdropBlur.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(backdropBlur)

        backdropColor.backgroundColor = theme.backdropColor
        backdropColor.alpha           = 0
        backdropColor.frame           = view.bounds
        backdropColor.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(backdropColor)

        let tap = UITapGestureRecognizer(target: self, action: #selector(backdropTapped))
        tap.cancelsTouchesInView = false
        tap.delegate = self
        view.addGestureRecognizer(tap)

        scrollView.frame            = view.bounds
        scrollView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(scrollView)
        scrollView.addSubview(canvas)

        buildSnapshot()
        buildEmojiPanel()
        buildActionsView()
    }

    public override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        guard !didPerformLayout, view.bounds.width > 0 else { return }
        didPerformLayout = true
        performLayout()
        configuration.sourceView.alpha = 0
    }

    public override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        animateOpen()
    }

    public override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        configuration.sourceView.alpha = 1
    }

    public override var preferredStatusBarStyle: UIStatusBarStyle {
        presentingViewController?.preferredStatusBarStyle ?? .default
    }

    // MARK: Build

    private func buildSnapshot() {
        let src = configuration.sourceView
        guard let snap = src.snapshotView(afterScreenUpdates: false) else { return }

        snap.frame                    = CGRect(origin: .zero, size: src.bounds.size)
        snap.isUserInteractionEnabled = false
        snap.layer.cornerRadius       = ChatLayoutConstants.bubbleCornerRadius
        snap.layer.cornerCurve        = .continuous
        snap.layer.masksToBounds      = true

        let wrapper = UIView()
        wrapper.frame               = CGRect(origin: .zero, size: src.bounds.size)
        wrapper.layer.shadowColor   = UIColor.black.cgColor
        wrapper.layer.shadowOpacity = 0.16
        wrapper.layer.shadowRadius  = 10
        wrapper.layer.shadowOffset  = CGSize(width: 0, height: 3)
        wrapper.addSubview(snap)
        canvas.addSubview(wrapper)
        snapshotView = wrapper
    }

    private func buildEmojiPanel() {
        emojiPanelView.configure(with: configuration.emojis)
        emojiPanelView.onEmojiTap = { [weak self] e in self?.dismissWith(emoji: e) }
        canvas.addSubview(emojiPanelView)
    }

    private func buildActionsView() {
        actionsMenuView.configure(with: configuration.actions)
        actionsMenuView.onActionTap = { [weak self] a in self?.dismissWith(action: a) }
        canvas.addSubview(actionsMenuView)
    }

    // MARK: Layout

    private func performLayout() {
        let safe    = view.safeAreaInsets
        let screenW = view.bounds.width
        let screenH = view.bounds.height
        let hPad    = theme.horizontalPadding
        let vPad    = theme.verticalPadding

        // Source frame в координатах нашего view
        let src = view.convert(sourceFrameInWindow, from: view.window)

        let snapW = src.width
        let snapH = src.height

        let emojiSz = emojiPanelView.preferredSize(for: configuration.emojis)
        let emojiW  = min(emojiSz.width, screenW - hPad * 2)
        let emojiH  = emojiSz.height

        let menuW = min(theme.menuWidth, screenW - hPad * 2)
        let menuH = actionsMenuView.preferredHeight(for: configuration.actions)

        let eGap = theme.emojiPanelSpacing
        let mGap = theme.menuSpacing

        let topLimit    = safe.top + vPad
        let bottomLimit = screenH - safe.bottom - vPad
        let available   = bottomLimit - topLimit

        // Горизонталь snapshot
        let snapX = max(hPad, min(src.minX, screenW - snapW - hPad))

        // Горизонталь emoji: выравниваем по правому краю snapshot, но не выходим за экран
        var emojiX = snapX + snapW - emojiW
        emojiX = max(hPad, min(emojiX, screenW - emojiW - hPad))

        // Горизонталь menu: по левому краю snapshot
        var menuX = snapX
        if menuX + menuW > screenW - hPad { menuX = screenW - hPad - menuW }

        let totalH = emojiH + eGap + snapH + mGap + menuH
        needsScroll = totalH > available

        // Вертикальные позиции в canvas
        let emojiYc, snapYc, menuYc, canvasH: CGFloat
        let initOffsetY: CGFloat

        if !needsScroll {
            let ideal    = src.minY - emojiH - eGap
            let blockTop = max(topLimit, min(ideal, bottomLimit - totalH))
            emojiYc     = blockTop
            snapYc      = emojiYc + emojiH + eGap
            menuYc      = snapYc + snapH + mGap
            canvasH     = screenH
            initOffsetY = 0
        } else {
            emojiYc     = safe.top + vPad
            snapYc      = emojiYc + emojiH + eGap
            menuYc      = snapYc + snapH + mGap
            canvasH     = menuYc + menuH + safe.bottom + vPad
            initOffsetY = max(0, menuYc + menuH + safe.bottom + vPad - screenH)
        }

        // Применяем layout canvas
        canvas.frame           = CGRect(x: 0, y: 0, width: screenW, height: canvasH)
        scrollView.contentSize = canvas.frame.size
        scrollView.isScrollEnabled = needsScroll

        // Целевые фреймы (куда всё должно прийти)
        targetSnapFrame    = CGRect(x: snapX,  y: snapYc,  width: snapW,  height: snapH)
        targetEmojiFrame   = CGRect(x: emojiX, y: emojiYc, width: emojiW, height: emojiH)
        targetActionsFrame = CGRect(x: menuX,  y: menuYc,  width: menuW,  height: menuH)

        // Snapshot стартует точно на месте sourceView
        let originY = src.minY + initOffsetY
        snapshotView?.frame = CGRect(x: src.minX, y: originY, width: snapW, height: snapH)

        scrollView.contentOffset = CGPoint(x: 0, y: initOffsetY)

        // ── Начальные позиции панелей ────────────────────────────────────────
        // Панели стартуют вплотную к снапшоту в его НАЧАЛЬНОЙ позиции (у sourceView).
        // Анимируются frame → target вместе со снапшотом.
        // transform используется только для scale (не для смещения) — это важно:
        // смешивать frame-анимацию и translate-transform нельзя.
        //
        // Начальная позиция снапшота в canvas = (src.minX, originY)
        // Emoji стартует прямо НАД снапшотом: y = originY - emojiH - eGap
        // Actions стартует прямо ПОД снапшотом: y = originY + snapH + mGap

        // Позиционирование через bounds + center, НЕ через frame.
        // Правило: когда transform != .identity, frame — вычисляемое свойство
        // (bounding box после трансформации), устанавливать его нельзя.
        // Правильный порядок: сначала задать bounds (размер), потом center (позиция),
        // потом transform (scale). center всегда в координатах superview и не зависит
        // от transform — это единственная надёжная точка для позиционирования.
        //
        // Стартовый center: панели у снапшота в его начальной позиции (originY).
        // Emoji — над снапшотом, actions — под.

        let startScale: CGFloat = 0.5

        emojiPanelView.bounds    = CGRect(origin: .zero, size: CGSize(width: emojiW, height: emojiH))
        emojiPanelView.center    = CGPoint(x: emojiX + emojiW / 2,
                                           y: originY - eGap - emojiH / 2)
        emojiPanelView.alpha     = 0
        emojiPanelView.transform = CGAffineTransform(scaleX: startScale, y: startScale)

        actionsMenuView.bounds   = CGRect(origin: .zero, size: CGSize(width: menuW, height: menuH))
        actionsMenuView.center   = CGPoint(x: menuX + menuW / 2,
                                           y: originY + snapH + mGap + menuH / 2)
        actionsMenuView.alpha    = 0
        actionsMenuView.transform = CGAffineTransform(scaleX: startScale, y: startScale)
    }

    // MARK: Animations

    private func animateOpen() {
        guard didPerformLayout else { return }

        let dur = theme.openDuration
        let d   = theme.springDamping
        let v   = theme.springVelocity

        // Backdrop
        UIView.animate(withDuration: dur * 0.55, delay: 0, options: .curveEaseOut) {
            self.backdropBlur.alpha  = 1
            self.backdropColor.alpha = 1
        }

        // Snapshot летит на целевую позицию — это основная анимация
        UIView.animate(
            withDuration: dur, delay: 0,
            usingSpringWithDamping: d, initialSpringVelocity: v,
            options: .allowUserInteraction
        ) {
            self.snapshotView?.frame = self.targetSnapFrame
        }

        // Панели летят из стартовой позиции (у sourceView) к target.
        // frame + transform анимируются вместе с тем же spring что у снапшота —
        // визуально весь блок движется как единое целое.

        // Анимируем center (позиция) + transform (scale) — НЕ frame.
        // Целевой center вычисляется из targetFrame (уже без transform).
        let emojiTargetCenter   = CGPoint(x: self.targetEmojiFrame.midX,
                                          y: self.targetEmojiFrame.midY)
        let actionsTargetCenter = CGPoint(x: self.targetActionsFrame.midX,
                                          y: self.targetActionsFrame.midY)

        UIView.animate(
            withDuration: dur, delay: 0,
            usingSpringWithDamping: d, initialSpringVelocity: v,
            options: .allowUserInteraction
        ) {
            self.actionsMenuView.center    = actionsTargetCenter
            self.actionsMenuView.transform = .identity
            self.actionsMenuView.alpha     = 1
        }

        UIView.animate(
            withDuration: dur, delay: 0,
            usingSpringWithDamping: d - 0.1, initialSpringVelocity: v,
            options: .allowUserInteraction
        ) {
            self.emojiPanelView.center    = emojiTargetCenter
            self.emojiPanelView.transform = .identity
            self.emojiPanelView.alpha     = 1
        }
    }

    private func animateClose(completion: @escaping () -> Void) {
        guard !isDismissing else { return }
        isDismissing = true
        let dur = theme.closeDuration

        let srcInView     = view.convert(sourceFrameInWindow, from: view.window)
        let currentOffset = scrollView.contentOffset.y
        let returnFrame   = CGRect(
            x: srcInView.minX,
            y: srcInView.minY + currentOffset,
            width: srcInView.width,
            height: srcInView.height
        )

        // Панели схлопываются обратно к позиции sourceView (зеркально открытию)
        let snapEndY = srcInView.minY + currentOffset

        let closeEmojiFrame   = CGRect(x: self.targetEmojiFrame.minX,
                                       y: snapEndY - self.targetEmojiFrame.height - theme.emojiPanelSpacing,
                                       width: self.targetEmojiFrame.width,
                                       height: self.targetEmojiFrame.height)
        let closeActionsFrame = CGRect(x: self.targetActionsFrame.minX,
                                       y: snapEndY + srcInView.height + theme.menuSpacing,
                                       width: self.targetActionsFrame.width,
                                       height: self.targetActionsFrame.height)

        // Закрытие: center → позиция у снапшота, transform → scale, alpha → 0
        let closeScale: CGFloat = 0.5
        let emojiCloseCenter   = CGPoint(x: closeEmojiFrame.midX,   y: closeEmojiFrame.midY)
        let actionsCloseCenter = CGPoint(x: closeActionsFrame.midX, y: closeActionsFrame.midY)

        UIView.animate(
            withDuration: dur, delay: 0,
            usingSpringWithDamping: 0.9, initialSpringVelocity: 0.2,
            options: []
        ) {
            self.backdropBlur.alpha  = 0
            self.backdropColor.alpha = 0

            self.emojiPanelView.center    = emojiCloseCenter
            self.emojiPanelView.transform = CGAffineTransform(scaleX: closeScale, y: closeScale)
            self.emojiPanelView.alpha     = 0

            self.actionsMenuView.center    = actionsCloseCenter
            self.actionsMenuView.transform = CGAffineTransform(scaleX: closeScale, y: closeScale)
            self.actionsMenuView.alpha     = 0

            self.snapshotView?.frame = returnFrame
        } completion: { _ in
            completion()
        }
    }

    // MARK: Dismiss

    @objc private func backdropTapped() { dismissMenu() }

    private func dismissWith(emoji: String) {
        animateClose { [weak self] in
            guard let self else { return }
            self.delegate?.contextMenu(self, didSelectEmoji: emoji, forId: self.configuration.id)
        }
    }

    private func dismissWith(action: ContextMenuAction) {
        animateClose { [weak self] in
            guard let self else { return }
            self.delegate?.contextMenu(self, didSelectAction: action, forId: self.configuration.id)
        }
    }

    public func dismissMenu() {
        animateClose { [weak self] in
            guard let self else { return }
            self.delegate?.contextMenuDidDismiss(self, id: self.configuration.id)
        }
    }

    private func applyTheme() {
        backdropBlur.effect           = UIBlurEffect(style: theme.backdropBlurStyle)
        backdropColor.backgroundColor = theme.backdropColor
    }

    // MARK: - Factory

    public static func present(
        configuration: ContextMenuConfiguration,
        theme: ContextMenuTheme = .light,
        from sourceViewController: UIViewController,
        delegate: ContextMenuDelegate? = nil
    ) {
        let menuVC      = ContextMenuViewController(configuration: configuration, theme: theme)
        menuVC.delegate = delegate
        menuVC.modalPresentationStyle = .overFullScreen
        menuVC.modalTransitionStyle   = .crossDissolve
        sourceViewController.present(menuVC, animated: false)
    }
}

// MARK: - UIGestureRecognizerDelegate

extension ContextMenuViewController: UIGestureRecognizerDelegate {

    public func gestureRecognizer(_ gr: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        let ptCanvas = touch.location(in: canvas)
        if emojiPanelView.frame.contains(ptCanvas)  { return false }
        if actionsMenuView.frame.contains(ptCanvas)  { return false }
        if let snap = snapshotView, snap.frame.contains(ptCanvas) { return false }
        return true
    }

    public func gestureRecognizer(
        _ gr: UIGestureRecognizer,
        shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer
    ) -> Bool { true }
}

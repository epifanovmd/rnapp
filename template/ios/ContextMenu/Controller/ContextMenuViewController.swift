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

    private var isDismissing      = false
    private var didPerformLayout  = false
    private var sourceFrameInWindow: CGRect = .zero
    private var targetSnapFrame:     CGRect = .zero  // в coords canvas
    private var needsScroll = false

    // MARK: Views

    private let backdropBlur  = UIVisualEffectView()
    private let backdropColor = UIView()

    // ЕДИНЫЙ scrollView — весь контент (emoji + snap + actions) скролится вместе
    private let scrollView: UIScrollView = {
        let sv = UIScrollView()
        sv.showsVerticalScrollIndicator   = false
        sv.showsHorizontalScrollIndicator = false
        sv.contentInsetAdjustmentBehavior = .never
        sv.backgroundColor                = .clear
        sv.alwaysBounceVertical           = false
        // НЕ задерживаем тачи — кнопки в панелях реагируют мгновенно
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

        // Захват frame ДО любого layout
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

        // 1. Backdrop (самый нижний слой)
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

        // Tap-to-dismiss: cancelsTouchesInView = false → тачи долетают до scrollView/панелей.
        // UIGestureRecognizerDelegate.shouldReceive фильтрует нажатия на контент.
        let tap = UITapGestureRecognizer(target: self, action: #selector(backdropTapped))
        tap.cancelsTouchesInView = false
        tap.delegate = self
        view.addGestureRecognizer(tap)

        // 2. ScrollView поверх backdrop
        scrollView.frame            = view.bounds
        scrollView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(scrollView)
        scrollView.addSubview(canvas)

        // 3. Контент
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

        // Точный размер 1:1 — никаких autoresizingMask, никакого scale
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

        // Source frame в coords нашего view
        let src = view.convert(sourceFrameInWindow, from: view.window)

        // Размеры элементов
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

        // Горизонталь: snapshot сохраняет X исходника
        let snapX = max(hPad, min(src.minX, screenW - snapW - hPad))

        // Горизонталь emoji: прижаты к правому краю snapshot
        var emojiX = snapX + snapW - emojiW
        emojiX = max(hPad, min(emojiX, screenW - emojiW - hPad))

        // Горизонталь menu: по левому краю snapshot
        var menuX = snapX
        if menuX + menuW > screenW - hPad { menuX = screenW - hPad - menuW }

        // Общая высота всего блока
        let totalH = emojiH + eGap + snapH + mGap + menuH
        needsScroll = totalH > available

        // --- Вертикаль в canvas ---
        let emojiYc: CGFloat   // Y emoji в canvas
        let snapYc:  CGFloat   // Y snapshot в canvas
        let menuYc:  CGFloat   // Y menu в canvas
        let canvasH: CGFloat
        let initOffsetY: CGFloat  // начальный contentOffset.y

        if !needsScroll {
            // Блок помещается: держимся близко к исходному Y snapshot
            let ideal    = src.minY - emojiH - eGap
            let blockTop = max(topLimit, min(ideal, bottomLimit - totalH))
            emojiYc    = blockTop
            snapYc     = emojiYc + emojiH + eGap
            menuYc     = snapYc + snapH + mGap
            canvasH    = screenH
            initOffsetY = 0
        } else {
            // Скролл: canvas растягивается, начальный offset — видим низ + menu
            //  [ topPad ] emoji gap snap gap menu [ bottomPad ]
            emojiYc    = safe.top + vPad
            snapYc     = emojiYc + emojiH + eGap
            menuYc     = snapYc + snapH + mGap
            canvasH    = menuYc + menuH + safe.bottom + vPad
            // Начальная позиция: меню и низ snapshot видны
            initOffsetY = max(0, menuYc + menuH + safe.bottom + vPad - screenH)
        }

        // Применяем
        canvas.frame           = CGRect(x: 0, y: 0, width: screenW, height: canvasH)
        scrollView.contentSize = canvas.frame.size
        scrollView.isScrollEnabled = needsScroll

        // Frames в canvas
        emojiPanelView.frame  = CGRect(x: emojiX, y: emojiYc, width: emojiW, height: emojiH)
        actionsMenuView.frame = CGRect(x: menuX,  y: menuYc,  width: menuW,  height: menuH)
        targetSnapFrame       = CGRect(x: snapX,  y: snapYc,  width: snapW,  height: snapH)

        // Snapshot стартует с позиции sourceView в coords canvas
        // (canvas совпадает с view coords при offset=0, поэтому считаем через offset)
        let originY = src.minY + initOffsetY   // чтобы snapshot визуально был на месте source
        snapshotView?.frame = CGRect(x: src.minX, y: originY, width: snapW, height: snapH)

        // Устанавливаем начальный offset
        scrollView.contentOffset = CGPoint(x: 0, y: initOffsetY)

        // Начальное состояние панелей
        emojiPanelView.alpha      = 0
        emojiPanelView.transform  = CGAffineTransform(scaleX: 0.5, y: 0.5)
        actionsMenuView.alpha     = 0
        actionsMenuView.transform = CGAffineTransform(scaleX: 0.8, y: 0.8)
        snapshotView?.alpha       = 1
        snapshotView?.transform   = .identity
    }

    // MARK: Animations

    private func animateOpen() {
        guard didPerformLayout else { return }
        let dur = theme.openDuration
        let d   = theme.springDamping
        let v   = theme.springVelocity

        UIView.animate(withDuration: dur * 0.5) {
            self.backdropBlur.alpha  = 1
            self.backdropColor.alpha = 1
        }

        // Snapshot движется на целевую позицию
        UIView.animate(withDuration: dur, delay: 0,
            usingSpringWithDamping: d, initialSpringVelocity: v,
            options: .allowUserInteraction) {
            self.snapshotView?.frame = self.targetSnapFrame
        }

        // Actions
        UIView.animate(withDuration: dur * 0.9, delay: dur * 0.04,
            usingSpringWithDamping: d, initialSpringVelocity: v,
            options: .allowUserInteraction) {
            self.actionsMenuView.alpha     = 1
            self.actionsMenuView.transform = .identity
        }

        // Emoji — pop
        UIView.animate(withDuration: dur * 0.8, delay: dur * 0.05,
            usingSpringWithDamping: 0.6, initialSpringVelocity: 1.0,
            options: .allowUserInteraction) {
            self.emojiPanelView.alpha     = 1
            self.emojiPanelView.transform = .identity
        }
    }

    private func animateClose(completion: @escaping () -> Void) {
        guard !isDismissing else { return }
        isDismissing = true
        let dur = theme.closeDuration

        // Snapshot возвращается на место sourceView в coords canvas
        let srcInView    = view.convert(sourceFrameInWindow, from: view.window)
        let currentOffset = scrollView.contentOffset.y
        let returnFrame  = CGRect(
            x: srcInView.minX,
            y: srcInView.minY + currentOffset,
            width: srcInView.width,
            height: srcInView.height
        )

        UIView.animate(withDuration: dur, delay: 0, options: .curveEaseIn) {
            self.backdropBlur.alpha    = 0
            self.backdropColor.alpha   = 0
            self.emojiPanelView.alpha  = 0
            self.actionsMenuView.alpha = 0
            self.emojiPanelView.transform  = CGAffineTransform(scaleX: 0.6, y: 0.6)
            self.actionsMenuView.transform = CGAffineTransform(scaleX: 0.8, y: 0.8)
        }

        UIView.animate(withDuration: dur * 1.1, delay: 0,
            usingSpringWithDamping: 0.85, initialSpringVelocity: 0.2, options: []) {
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
            self.presentingViewController?.dismiss(animated: false)
        }
    }

    private func dismissWith(action: ContextMenuAction) {
        animateClose { [weak self] in
            guard let self else { return }
            self.delegate?.contextMenu(self, didSelectAction: action, forId: self.configuration.id)
            self.presentingViewController?.dismiss(animated: false)
        }
    }

    public func dismissMenu() {
        animateClose { [weak self] in
            guard let self else { return }
            self.delegate?.contextMenuDidDismiss(self, id: self.configuration.id)
            self.presentingViewController?.dismiss(animated: false)
        }
    }

    private func applyTheme() {
        backdropBlur.effect           = UIBlurEffect(style: theme.backdropBlurStyle)
        backdropColor.backgroundColor = theme.backdropColor
    }

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
// Тап на backdrop не срабатывает если точка попала на контентные элементы

extension ContextMenuViewController: UIGestureRecognizerDelegate {

    public func gestureRecognizer(_ gr: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        // Все координаты в системе canvas (учитывает scrollView offset)
        let ptCanvas = touch.location(in: canvas)
        if emojiPanelView.frame.contains(ptCanvas)  { return false }
        if actionsMenuView.frame.contains(ptCanvas) { return false }
        if let snap = snapshotView, snap.frame.contains(ptCanvas) { return false }
        return true
    }

    // Позволяем backdrop-тапу срабатывать одновременно со scrollView
    public func gestureRecognizer(
        _ gr: UIGestureRecognizer,
        shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer
    ) -> Bool { true }
}

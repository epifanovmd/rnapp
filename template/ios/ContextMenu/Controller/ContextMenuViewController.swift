// MARK: - ContextMenuViewController.swift
//
// Архитектура (финальная):
//
//  Слои (снизу вверх):
//    1. backdropBlur + backdropColor  — на всё view, ловят тап через gr.delegate
//    2. fixedPanel (emoji + actions)  — НЕ в scrollView, прибиты к safe area
//    3. scrollView                    — только между emoji и actions
//       └ canvas
//           └ snapshotView           — снапшот sourceView, 1:1 без scale
//
//  Большое сообщение:
//    emoji  — прибита к topLimit (fixed)
//    actions — прибиты к bottomLimit (fixed)
//    между ними — scrollView, начальный offset = bottom (видно низ сообщения)
//    можно скролить вверх чтобы увидеть всё сообщение

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

    // MARK: - State

    private var isDismissing      = false
    private var didPerformLayout  = false
    /// Frame sourceView в координатах window — захватывается до первого layout
    private var sourceFrameInWindow: CGRect = .zero
    /// Итоговый frame снапшота в координатах view (куда он должен попасть)
    private var targetSnapshotFrame: CGRect = .zero
    /// Начальный frame снапшота (позиция sourceView) в координатах view
    private var originSnapshotFrame: CGRect = .zero

    // MARK: - Views

    private let backdropBlur  = UIVisualEffectView()
    private let backdropColor = UIView()

    /// Emoji-панель и меню — фиксированные, НЕ внутри scrollView
    private let emojiPanel:  ContextMenuEmojiPanel
    private let actionsView: ContextMenuActionsView

    /// ScrollView — только для snapshotView, зажат между emojiPanel и actionsView
    private let scrollView: UIScrollView = {
        let sv = UIScrollView()
        sv.showsVerticalScrollIndicator   = true
        sv.showsHorizontalScrollIndicator = false
        sv.alwaysBounceVertical           = false
        sv.contentInsetAdjustmentBehavior = .never
        sv.backgroundColor                = .clear
        sv.clipsToBounds                  = false
        return sv
    }()

    private var snapshotView: UIView?

    // MARK: - Layout cache (заполняется в performLayout)

    private var emojiFrame:   CGRect = .zero
    private var actionsFrame: CGRect = .zero
    private var scrollFrame:  CGRect = .zero

    // MARK: - Init

    public init(configuration: ContextMenuConfiguration, theme: ContextMenuTheme = .light) {
        self.configuration = configuration
        self.theme         = theme
        self.emojiPanel    = ContextMenuEmojiPanel(theme: theme)
        self.actionsView   = ContextMenuActionsView(theme: theme)
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .overFullScreen
        modalTransitionStyle   = .crossDissolve
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Lifecycle

    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear

        // Backdrop
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

        // ScrollView для снапшота
        view.addSubview(scrollView)
        scrollView.addSubview(UIView()) // placeholder, snap добавим в buildSnapshot

        // Фиксированные панели поверх всего
        view.addSubview(emojiPanel)
        view.addSubview(actionsView)

        // Запоминаем frame ДО layout
        let src = configuration.sourceView
        if let win = src.window {
            sourceFrameInWindow = src.convert(src.bounds, to: win)
        }

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

    // MARK: - Build

    private func buildSnapshot() {
        let src = configuration.sourceView

        // Снапшот 1:1 — точный размер sourceView
        guard let snap = src.snapshotView(afterScreenUpdates: false) else { return }
        snap.isUserInteractionEnabled = false
        // Задаём точный frame сразу
        snap.frame = src.bounds

        // Wrapper для тени
        let wrapper = UIView()
        wrapper.frame = src.bounds  // точный размер исходника
        wrapper.layer.shadowColor   = UIColor.black.cgColor
        wrapper.layer.shadowOpacity = 0.18
        wrapper.layer.shadowRadius  = 12
        wrapper.layer.shadowOffset  = CGSize(width: 0, height: 3)
        // cornerRadius только на снапшоте, wrapper остаётся без clip чтобы тень была видна
        snap.layer.cornerRadius  = ChatLayoutConstants.bubbleCornerRadius
        snap.layer.cornerCurve   = .continuous
        snap.layer.masksToBounds = true
        wrapper.addSubview(snap)

        // Убираем старый placeholder
        scrollView.subviews.forEach { $0.removeFromSuperview() }
        scrollView.addSubview(wrapper)
        snapshotView = wrapper
    }

    private func buildEmojiPanel() {
        emojiPanel.configure(with: configuration.emojis)
        emojiPanel.onEmojiTap = { [weak self] emoji in self?.dismissWith(emoji: emoji) }
    }

    private func buildActionsView() {
        actionsView.configure(with: configuration.actions)
        actionsView.onActionTap = { [weak self] action in self?.dismissWith(action: action) }
    }

    // MARK: - Layout

    private func performLayout() {
        let safeArea = view.safeAreaInsets
        let screenW  = view.bounds.width
        let screenH  = view.bounds.height
        let hPad     = theme.horizontalPadding
        let vPad     = theme.verticalPadding

        // Frame sourceView в координатах нашего view
        let srcInView = view.convert(sourceFrameInWindow, from: view.window)
        let srcW = srcInView.width
        let srcH = srcInView.height

        // Emoji panel
        let emojiSz = emojiPanel.preferredSize(for: configuration.emojis)
        let emojiW  = min(emojiSz.width, screenW - hPad * 2)
        let emojiH  = emojiSz.height

        // Actions
        let menuW = min(theme.menuWidth, screenW - hPad * 2)
        let menuH = actionsView.preferredHeight(for: configuration.actions)

        let emojiGap = theme.emojiPanelSpacing
        let menuGap  = theme.menuSpacing

        let topLimit    = safeArea.top + vPad
        let bottomLimit = screenH - safeArea.bottom - vPad

        // Горизонталь preview — сохраняем X исходника
        let previewX = max(hPad, min(srcInView.minX, screenW - srcW - hPad))

        // Горизонталь emoji — по правому краю preview
        var emojiX = previewX + srcW - emojiW
        emojiX = max(hPad, min(emojiX, screenW - emojiW - hPad))

        // Горизонталь menu — по левому краю preview
        var menuX = previewX
        if menuX + menuW > screenW - hPad { menuX = screenW - hPad - menuW }

        // --- Вертикаль ---
        // Доступное пространство между панелями
        let panelsH  = emojiH + emojiGap + menuGap + menuH
        let spaceForPreview = (bottomLimit - topLimit) - panelsH

        // Помещается ли preview без скролла
        let needsScroll = srcH > spaceForPreview

        var emojiY:   CGFloat
        var menuY:    CGFloat
        var previewY: CGFloat

        if !needsScroll {
            // Всё помещается — стараемся держать preview на исходной позиции
            let totalH       = emojiH + emojiGap + srcH + menuGap + menuH
            let idealBlockTop = srcInView.minY - emojiH - emojiGap
            let minBlockTop   = topLimit
            let maxBlockTop   = bottomLimit - totalH
            let blockTop      = max(minBlockTop, min(idealBlockTop, maxBlockTop))

            emojiY   = blockTop
            previewY = emojiY + emojiH + emojiGap
            menuY    = previewY + srcH + menuGap
        } else {
            // Большое сообщение — панели прибиваем к границам, preview между ними
            emojiY   = topLimit
            menuY    = bottomLimit - menuH
            previewY = emojiY + emojiH + emojiGap  // верхняя точка preview = под emoji
        }

        // Сохраняем frames панелей
        emojiFrame   = CGRect(x: emojiX, y: emojiY, width: emojiW, height: emojiH)
        actionsFrame = CGRect(x: menuX,  y: menuY,  width: menuW,  height: menuH)

        emojiPanel.frame   = emojiFrame
        actionsView.frame  = actionsFrame

        // ScrollView — зажат между нижней границей emoji и верхней границей actions
        let svTop    = emojiY + emojiH + emojiGap
        let svBottom = menuY - menuGap
        let svHeight = max(0, svBottom - svTop)
        scrollFrame  = CGRect(x: 0, y: svTop, width: screenW, height: svHeight)
        scrollView.frame = scrollFrame
        scrollView.isScrollEnabled = needsScroll

        // Контент в scrollView = снапшот
        // Горизонтальный отступ чтобы снапшот был на нужном X
        let snapInScrollX = previewX  // отступ слева внутри scrollView

        let canvasH = max(svHeight, srcH)
        scrollView.contentSize = CGSize(width: screenW, height: canvasH)

        // Позиция снапшота внутри scrollView: Y=0 (скролл сделает нужный offset)
        targetSnapshotFrame = CGRect(x: snapInScrollX, y: 0, width: srcW, height: srcH)

        // Начальная позиция снапшота = позиция sourceView относительно scrollView
        // (scrollView.frame.origin в координатах view)
        let snapOriginInScroll = CGRect(
            x: srcInView.minX,
            y: srcInView.minY - svTop,  // относительно scrollView
            width: srcW,
            height: srcH
        )
        originSnapshotFrame = snapOriginInScroll

        // Если нужен скролл — показываем низ сообщения (начальный offset = bottom)
        if needsScroll {
            let maxOffset = max(0, srcH - svHeight)
            scrollView.contentOffset = CGPoint(x: 0, y: maxOffset)
        }

        // Снапшот стартует с позиции sourceView
        snapshotView?.frame = originSnapshotFrame

        // Начальное состояние панелей
        emojiPanel.alpha      = 0
        emojiPanel.transform  = CGAffineTransform(scaleX: 0.5, y: 0.5)
        actionsView.alpha     = 0
        actionsView.transform = CGAffineTransform(scaleX: 0.8, y: 0.8)
        snapshotView?.alpha   = 1
        snapshotView?.transform = .identity
    }

    // MARK: - Animations

    private func animateOpen() {
        guard didPerformLayout else { return }
        let dur = theme.openDuration
        let d   = theme.springDamping
        let v   = theme.springVelocity

        UIView.animate(withDuration: dur * 0.5, delay: 0, options: .curveEaseOut) {
            self.backdropBlur.alpha  = 1
            self.backdropColor.alpha = 1
        }

        // Снапшот плавно двигается на целевую позицию
        UIView.animate(
            withDuration: dur, delay: 0,
            usingSpringWithDamping: d, initialSpringVelocity: v,
            options: .allowUserInteraction
        ) {
            self.snapshotView?.frame = self.targetSnapshotFrame
        }

        // Меню снизу
        UIView.animate(
            withDuration: dur * 0.9, delay: dur * 0.04,
            usingSpringWithDamping: d, initialSpringVelocity: v,
            options: .allowUserInteraction
        ) {
            self.actionsView.alpha     = 1
            self.actionsView.transform = .identity
        }

        // Emoji — pop
        UIView.animate(
            withDuration: dur * 0.8, delay: dur * 0.05,
            usingSpringWithDamping: 0.6, initialSpringVelocity: 1.0,
            options: .allowUserInteraction
        ) {
            self.emojiPanel.alpha     = 1
            self.emojiPanel.transform = .identity
        }
    }

    private func animateClose(completion: @escaping () -> Void) {
        guard !isDismissing else { return }
        isDismissing = true
        let dur = theme.closeDuration

        // Считаем куда вернуть снапшот — позиция sourceView в системе координат scrollView
        let srcInView   = view.convert(sourceFrameInWindow, from: view.window)
        let returnFrame = CGRect(
            x: srcInView.minX,
            y: srcInView.minY - scrollFrame.minY,
            width: srcInView.width,
            height: srcInView.height
        )

        // Сбрасываем scroll offset перед возвратом чтобы анимация была плавной
        if scrollView.contentOffset.y > 0 {
            UIView.animate(withDuration: dur * 0.5) {
                self.scrollView.contentOffset = .zero
            }
        }

        UIView.animate(withDuration: dur, delay: 0, options: .curveEaseIn) {
            self.backdropBlur.alpha    = 0
            self.backdropColor.alpha   = 0
            self.emojiPanel.alpha      = 0
            self.actionsView.alpha     = 0
            self.emojiPanel.transform  = CGAffineTransform(scaleX: 0.6, y: 0.6)
            self.actionsView.transform = CGAffineTransform(scaleX: 0.8, y: 0.8)
        }

        UIView.animate(
            withDuration: dur * 1.1, delay: 0,
            usingSpringWithDamping: 0.85, initialSpringVelocity: 0.2,
            options: []
        ) {
            self.snapshotView?.frame = returnFrame
        } completion: { _ in
            completion()
        }
    }

    // MARK: - Dismiss

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

    // MARK: - Theme

    private func applyTheme() {
        backdropBlur.effect           = UIBlurEffect(style: theme.backdropBlurStyle)
        backdropColor.backgroundColor = theme.backdropColor
    }

    // MARK: - Static presenter

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
        // Тап на backdrop срабатывает только вне контентных зон
        let ptInView = touch.location(in: view)
        if emojiFrame.contains(ptInView)   { return false }
        if actionsFrame.contains(ptInView) { return false }
        if scrollFrame.contains(ptInView)  { return false }
        return true
    }
}

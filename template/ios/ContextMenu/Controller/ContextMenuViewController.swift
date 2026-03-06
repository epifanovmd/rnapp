import UIKit

// MARK: - ContextMenuDelegate

public protocol ContextMenuDelegate: AnyObject {
    func contextMenu(_ menu: ContextMenuViewController, didSelectEmoji emoji: String, forId id: String)
    func contextMenu(_ menu: ContextMenuViewController, didSelectAction action: ContextMenuAction, forId id: String)
    func contextMenuDidDismiss(_ menu: ContextMenuViewController, id: String)
}

// MARK: - ContextMenuViewController

public final class ContextMenuViewController: UIViewController {

    // MARK: - Public

    public weak var delegate:              ContextMenuDelegate?
    public private(set) var configuration: ContextMenuConfiguration
    public var theme: ContextMenuTheme { didSet { applyTheme() } }

    // MARK: - Private

    private var isDismissing:     Bool = false
    private var didPerformLayout: Bool = false
    private var layout:           ContextMenuLayout?
    private var animator:         ContextMenuAnimator?
    private var sourceFrameInWindow: CGRect = .zero

    private let backdrop     = ContextMenuBackdropView()
    private let scrollView   = UIScrollView.contextMenuStyle()
    private let canvas       = UIView()
    private var snapshotView: UIView?

    private let emojiPanel:   ContextMenuEmojiPanel
    private let actionsPanel: ContextMenuActionsView

    // MARK: - Init

    /// Создаёт контроллер контекстного меню. Захватывает frame sourceView до любых layout-проходов.
    public init(configuration: ContextMenuConfiguration, theme: ContextMenuTheme = .light) {
        self.configuration = configuration
        self.theme         = theme
        emojiPanel         = ContextMenuEmojiPanel(theme: theme)
        actionsPanel       = ContextMenuActionsView(theme: theme)
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .overFullScreen
        modalTransitionStyle   = .crossDissolve

        if let window = configuration.sourceView.window {
            sourceFrameInWindow = configuration.sourceView.convert(
                configuration.sourceView.bounds, to: window
            )
        }
    }

    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Lifecycle

    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        setupBackdrop()
        setupScrollView()
        buildContent()
    }

    public override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        guard !didPerformLayout, view.bounds.width > 0 else { return }
        didPerformLayout = true
        applyLayout()
        configuration.sourceView.alpha = 0
    }

    public override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        guard let layout, let animator else { return }
        animator.animateOpen(layout: layout)
    }

    public override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        configuration.sourceView.alpha = 1
    }

    public override var preferredStatusBarStyle: UIStatusBarStyle {
        presentingViewController?.preferredStatusBarStyle ?? .default
    }

    // MARK: - Public API

    /// Закрывает меню без выбора действия.
    public func dismissMenu() {
        close { [weak self] in
            guard let self else { return }
            self.delegate?.contextMenuDidDismiss(self, id: self.configuration.id)
        }
    }

    /// Создаёт и показывает контекстное меню из указанного контроллера.
    public static func present(configuration: ContextMenuConfiguration, theme: ContextMenuTheme = .light,
                                from vc: UIViewController, delegate: ContextMenuDelegate? = nil) {
        let menu      = ContextMenuViewController(configuration: configuration, theme: theme)
        menu.delegate = delegate
        vc.present(menu, animated: false)
    }

    // MARK: - Setup

    private func setupBackdrop() {
        backdrop.configure(with: theme)
        backdrop.frame            = view.bounds
        backdrop.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(backdrop)

        let tap = UITapGestureRecognizer(target: self, action: #selector(handleBackdropTap))
        tap.cancelsTouchesInView = false
        tap.delegate             = self
        view.addGestureRecognizer(tap)
    }

    private func setupScrollView() {
        scrollView.frame            = view.bounds
        scrollView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(scrollView)
        scrollView.addSubview(canvas)
    }

    /// Строит снапшот, emoji-панель и панель действий, добавляет их в canvas.
    private func buildContent() {
        snapshotView = makeSnapshotView(for: configuration.sourceView)
        if let snap = snapshotView { canvas.addSubview(snap) }

        emojiPanel.configure(with: configuration.emojis)
        emojiPanel.onEmojiTap = { [weak self] emoji in self?.selectEmoji(emoji) }
        canvas.addSubview(emojiPanel)

        actionsPanel.configure(with: configuration.actions)
        actionsPanel.onActionTap = { [weak self] action in self?.selectAction(action) }
        canvas.addSubview(actionsPanel)
    }

    // MARK: - Layout

    /// Рассчитывает layout через ContextMenuLayoutEngine, применяет его к canvas и инициализирует аниматор.
    private func applyLayout() {
        let sourceFrame = view.convert(sourceFrameInWindow, from: view.window)

        let computed = ContextMenuLayoutEngine.calculate(
            sourceFrame: sourceFrame,
            snapSize:    configuration.sourceView.bounds.size,
            emojiSize:   emojiPanel.preferredSize(for: configuration.emojis),
            actionsSize: CGSize(width: theme.menuWidth,
                                height: actionsPanel.preferredHeight(for: configuration.actions)),
            screen:   view.bounds,
            safeArea: view.safeAreaInsets,
            theme:    theme
        )
        layout = computed

        canvas.frame               = CGRect(origin: .zero, size: computed.canvasSize)
        scrollView.contentSize     = computed.canvasSize
        scrollView.isScrollEnabled = computed.needsScroll
        scrollView.contentOffset   = CGPoint(x: 0, y: computed.scrollOffset)

        animator = ContextMenuAnimator(
            theme:        theme,
            backdrop:     backdrop,
            snapshot:     snapshotView,
            emojiPanel:   emojiPanel,
            actionsPanel: actionsPanel
        )
        animator?.prepareOpen(layout: computed)
    }

    // MARK: - Actions

    @objc private func handleBackdropTap() { dismissMenu() }

    private func selectEmoji(_ emoji: String) {
        close { [weak self] in
            guard let self else { return }
            self.delegate?.contextMenu(self, didSelectEmoji: emoji, forId: self.configuration.id)
        }
    }

    private func selectAction(_ action: ContextMenuAction) {
        close { [weak self] in
            guard let self else { return }
            self.delegate?.contextMenu(self, didSelectAction: action, forId: self.configuration.id)
        }
    }

    // MARK: - Animation

    private func close(completion: @escaping () -> Void) {
        guard !isDismissing, let layout, let animator else { return }
        isDismissing = true

        let srcInView = view.convert(sourceFrameInWindow, from: view.window)
        let offset    = scrollView.contentOffset.y
        let returnFrame = CGRect(x: srcInView.minX, y: srcInView.minY + offset,
                                 width: srcInView.width, height: srcInView.height)

        animator.animateClose(returnFrame: returnFrame, layout: layout, completion: completion)
    }

    // MARK: - Theme

    private func applyTheme() {
        backdrop.configure(with: theme)
    }

    // MARK: - Helpers

    /// Создаёт снапшот sourceView c тенью, обёрнутый в wrapper.
    private func makeSnapshotView(for source: UIView) -> UIView? {
        guard let snap = source.snapshotView(afterScreenUpdates: false) else { return nil }
        snap.frame                = CGRect(origin: .zero, size: source.bounds.size)
        snap.isUserInteractionEnabled = false
        snap.layer.cornerRadius   = ChatLayoutConstants.bubbleCornerRadius
        snap.layer.cornerCurve    = .continuous
        snap.layer.masksToBounds  = true

        let wrapper = UIView(frame: CGRect(origin: .zero, size: source.bounds.size))
        wrapper.layer.shadowColor   = UIColor.black.cgColor
        wrapper.layer.shadowOpacity = 0.16
        wrapper.layer.shadowRadius  = 10
        wrapper.layer.shadowOffset  = CGSize(width: 0, height: 3)
        wrapper.addSubview(snap)
        return wrapper
    }
}

// MARK: - UIGestureRecognizerDelegate

extension ContextMenuViewController: UIGestureRecognizerDelegate {

    /// Разрешает backdrop-тап только если касание не попало на контентные view.
    public func gestureRecognizer(_ gr: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        let pt = touch.location(in: canvas)
        return ![emojiPanel, actionsPanel, snapshotView].compactMap { $0 }.contains { $0.frame.contains(pt) }
    }

    public func gestureRecognizer(_ gr: UIGestureRecognizer,
                                   shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool { true }
}

// MARK: - ContextMenuBackdropView

/// Комбинированный blur + color backdrop, инкапсулирует оба слоя.
private final class ContextMenuBackdropView: UIView {

    private let blurView  = UIVisualEffectView()
    private let colorView = UIView()

    override init(frame: CGRect) {
        super.init(frame: frame)
        [blurView, colorView].forEach {
            $0.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            addSubview($0)
        }
        alpha = 0
    }

    required init?(coder: NSCoder) { fatalError() }

    /// Применяет параметры темы к blur и color слоям.
    func configure(with theme: ContextMenuTheme) {
        blurView.effect           = UIBlurEffect(style: theme.backdropBlurStyle)
        colorView.backgroundColor = theme.backdropColor
        blurView.frame  = bounds
        colorView.frame = bounds
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        blurView.frame  = bounds
        colorView.frame = bounds
    }
}

// MARK: - UIScrollView factory

private extension UIScrollView {
    /// Создаёт UIScrollView с настройками для контекстного меню.
    static func contextMenuStyle() -> UIScrollView {
        let sv = UIScrollView()
        sv.showsVerticalScrollIndicator   = false
        sv.showsHorizontalScrollIndicator = false
        sv.contentInsetAdjustmentBehavior = .never
        sv.backgroundColor                = .clear
        sv.alwaysBounceVertical           = false
        sv.delaysContentTouches           = false
        sv.canCancelContentTouches        = true
        return sv
    }
}

// MARK: - ChatViewController.swift

import UIKit

final class ChatViewController: UIViewController {

    // MARK: - Публичные свойства

    weak var delegate: ChatViewControllerDelegate?
    var actions: [MessageAction] = []
    var topThreshold: CGFloat = 200
    var isLoading: Bool = false { didSet { updateLoadingState() } }
    var scrollToBottomThreshold: CGFloat = 150 { didSet { updateFABVisibility(animated: false) } }
    var theme: ChatTheme = .light { didSet { applyTheme() } }

    /// Список эмодзи для emoji-панели контекстного меню.
    /// Формат: ["❤️", "👍", "😂", "😮", "😢", "🙏"]
    var emojiReactionsList: [String] = [] {
        didSet { contextMenuEmojis = emojiReactionsList.map { ContextMenuEmoji(emoji: $0) } }
    }

    /// Дополнительный верхний отступ коллекции, задаётся из RN.
    var collectionExtraInsetTop: CGFloat = 0 {
        didSet {
            guard isViewLoaded else { return }
            collectionView.contentInset.top = ChatLayoutConstants.collectionTopPadding + collectionExtraInsetTop
        }
    }

    /// Дополнительный нижний отступ коллекции, задаётся из RN.
    var collectionExtraInsetBottom: CGFloat = 0 {
        didSet {
            guard isViewLoaded else { return }
            view.setNeedsLayout()
        }
    }

    // MARK: - Начальный скролл (управляется из RNChatView)

    var isInitialScrollProtected = false
    var pendingScrollMessageId: String?

    // MARK: - Internal — данные

    var sections: [MessageSection] = []
    var messageIndex: [String: ChatMessage] = [:]

    // MARK: - Internal — UI

    private(set) var collectionView: UICollectionView!
    var dataSource: UICollectionViewDiffableDataSource<String, String>!
    var inputBar: InputBarView!
    let sizeCache = MessageSizeCache()

    // MARK: - Internal — контекстное меню

    /// Эмодзи для панели контекстного меню, производное от emojiReactionsList.
    var contextMenuEmojis: [ContextMenuEmoji] = []

    // MARK: - Internal — keyboard freeze (управляется из ChatViewController_KeyboardFreeze)

    /// Замороженное значение contentInset.bottom на момент открытия контекстного меню.
    var frozenBottomInset: CGFloat?

    /// true пока контекстное меню открыто и inset заморожен.
    var isInsetFrozen: Bool = false

    /// true если клавиатура была видна в момент открытия контекстного меню.
    var keyboardWasVisible: Bool = false

    /// Observer нотификации keyboardWillHide, активен пока меню открыто.
    var kbHideObserver: Any?

    /// Observer нотификации keyboardDidShow, активен пока ждём возврата клавиатуры.
    var kbShowObserver: Any?

    // MARK: - Private — пустое состояние

    private let emptyStateContainer = UIView()

    private let emptyStateLabel: UILabel = {
        let label = UILabel()
        label.text          = NSLocalizedString("chat.empty", value: "No messages yet.\nBe the first! 👋", comment: "")
        label.font          = .systemFont(ofSize: 16)
        label.textAlignment = .center
        label.numberOfLines = 0
        return label
    }()

    private let centerSpinner: UIActivityIndicatorView = {
        let spinner = UIActivityIndicatorView(style: .large)
        spinner.hidesWhenStopped = true
        return spinner
    }()

    // MARK: - Private — FAB

    let fabButton: UIButton = {
        let button = UIButton(type: .custom)
        button.backgroundColor          = .clear
        button.alpha                    = 0
        button.isUserInteractionEnabled = false
        button.layer.shadowColor        = UIColor.black.cgColor
        button.layer.shadowOpacity      = 0.18
        button.layer.shadowRadius       = 8
        button.layer.shadowOffset       = CGSize(width: 0, height: 2)
        return button
    }()

    var fabBlurView: UIVisualEffectView!

    private let fabArrow: UIImageView = {
        let config = UIImage.SymbolConfiguration(pointSize: 18, weight: .semibold)
        let view   = UIImageView(image: UIImage(systemName: "chevron.down", withConfiguration: config))
        view.contentMode = .scaleAspectFit
        return view
    }()

    var fabVisible = false

    // MARK: - Private — констрейнты

    var inputBarKeyboardConstraint: NSLayoutConstraint?

    // MARK: - Private — состояние скролла

    var waitingForNewMessages    = false
    var lastKnownMessageCount    = 0
    var lastContentOffsetY: CGFloat = 0
    var isProgrammaticScroll     = false
    var visibleMessageIDs: Set<String> = []
    var lastSectionsInputHash: Int = 0
    var pendingHighlightId: String?
    var lastScrollEventTime: CFTimeInterval = 0
    let scrollThrottleInterval: CFTimeInterval = 1.0 / 30

    var isUserDragging = false

    // MARK: - Private — дебаунс видимости

    var pendingVisibleIDs: Set<String> = []
    var visibilityDebounceTask: DispatchWorkItem?
    let visibilityDebounceInterval: TimeInterval = 0.3

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        setupCollectionView()
        setupEmptyState()
        setupInputBar()
        setupFAB()
        setupDataSource()
        applyTheme()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        updateCollectionBottomInset()
        invalidateSizeCacheIfWidthChanged()
    }

    // MARK: - Тема

    private func applyTheme() {
        guard isViewLoaded else { return }
        collectionView.backgroundColor = theme.collectionViewBackground
        emptyStateLabel.textColor      = theme.emptyStateText
        fabArrow.tintColor             = theme.fabArrowColor
        rebuildFABBlur()
        inputBar.applyTheme(theme)
        collectionView.reloadData()
    }

    private func rebuildFABBlur() {
        let size: CGFloat = 40
        fabBlurView?.removeFromSuperview()
        fabBlurView = UIVisualEffectView(effect: UIBlurEffect(style: theme.fabBlurStyle))
        fabBlurView.translatesAutoresizingMaskIntoConstraints = false
        fabBlurView.isUserInteractionEnabled = false
        fabBlurView.layer.cornerRadius  = size / 2
        fabBlurView.layer.masksToBounds = true
        fabButton.insertSubview(fabBlurView, at: 0)
        NSLayoutConstraint.activate([
            fabBlurView.topAnchor.constraint(equalTo: fabButton.topAnchor),
            fabBlurView.bottomAnchor.constraint(equalTo: fabButton.bottomAnchor),
            fabBlurView.leadingAnchor.constraint(equalTo: fabButton.leadingAnchor),
            fabBlurView.trailingAnchor.constraint(equalTo: fabButton.trailingAnchor),
        ])
    }

    // MARK: - Setup — CollectionView

    private func setupCollectionView() {
        collectionView = UICollectionView(frame: .zero, collectionViewLayout: makeFlowLayout())
        collectionView.backgroundColor                = .clear
        collectionView.keyboardDismissMode            = .interactive
        collectionView.contentInset                   = UIEdgeInsets(top: ChatLayoutConstants.collectionTopPadding, left: 0, bottom: 0, right: 0)
        collectionView.contentInsetAdjustmentBehavior = .never
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        collectionView.register(MessageCell.self, forCellWithReuseIdentifier: MessageCell.reuseID)
        collectionView.register(
            DateSeparatorView.self,
            forSupplementaryViewOfKind: UICollectionView.elementKindSectionHeader,
            withReuseIdentifier: DateSeparatorView.reuseID
        )
        collectionView.delegate = self
        view.addSubview(collectionView)

        NSLayoutConstraint.activate([
            collectionView.topAnchor.constraint(equalTo: view.topAnchor),
            collectionView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            collectionView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            collectionView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        let tap = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))
        tap.cancelsTouchesInView = false
        collectionView.addGestureRecognizer(tap)
    }

    // MARK: - Setup — Empty state

    private func setupEmptyState() {
        [emptyStateContainer, emptyStateLabel, centerSpinner]
            .forEach { $0.translatesAutoresizingMaskIntoConstraints = false }
        emptyStateContainer.isHidden = true
        view.addSubview(emptyStateContainer)
        emptyStateContainer.addSubview(emptyStateLabel)
        emptyStateContainer.addSubview(centerSpinner)

        NSLayoutConstraint.activate([
            emptyStateContainer.topAnchor.constraint(equalTo: view.topAnchor),
            emptyStateContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            emptyStateContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            emptyStateContainer.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            emptyStateLabel.centerXAnchor.constraint(equalTo: emptyStateContainer.centerXAnchor),
            emptyStateLabel.centerYAnchor.constraint(equalTo: emptyStateContainer.centerYAnchor),
            emptyStateLabel.leadingAnchor.constraint(equalTo: emptyStateContainer.leadingAnchor, constant: 32),
            emptyStateLabel.trailingAnchor.constraint(equalTo: emptyStateContainer.trailingAnchor, constant: -32),
            centerSpinner.centerXAnchor.constraint(equalTo: emptyStateContainer.centerXAnchor),
            centerSpinner.centerYAnchor.constraint(equalTo: emptyStateContainer.centerYAnchor),
        ])
    }

    // MARK: - Setup — InputBar

    private func setupInputBar() {
        inputBar = InputBarView()
        inputBar.delegate = self
        inputBar.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(inputBar)

        NSLayoutConstraint.activate([
            inputBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            inputBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            inputBar.heightAnchor.constraint(greaterThanOrEqualToConstant: 52),
        ])

        if #available(iOS 15.0, *) {
            view.keyboardLayoutGuide.followsUndockedKeyboard = true
            let c = inputBar.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor)
            c.isActive = true
            inputBarKeyboardConstraint = c
        } else {
            let c = inputBar.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)
            c.isActive = true
            inputBarKeyboardConstraint = c
            KeyboardListener.shared.add(delegate: self)
        }
    }

    // MARK: - Setup — FAB

    private func setupFAB() {
        let size: CGFloat = 40
        fabArrow.translatesAutoresizingMaskIntoConstraints = false
        fabArrow.isUserInteractionEnabled = false
        fabButton.translatesAutoresizingMaskIntoConstraints = false
        fabButton.addSubview(fabArrow)
        fabButton.layer.cornerRadius  = size / 2
        fabButton.layer.masksToBounds = false
        fabButton.addTarget(self, action: #selector(fabTapped), for: .touchUpInside)
        view.addSubview(fabButton)

        NSLayoutConstraint.activate([
            fabButton.widthAnchor.constraint(equalToConstant: size),
            fabButton.heightAnchor.constraint(equalToConstant: size),
            fabButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            fabButton.bottomAnchor.constraint(equalTo: inputBar.topAnchor, constant: -12),
            fabArrow.centerXAnchor.constraint(equalTo: fabButton.centerXAnchor),
            fabArrow.centerYAnchor.constraint(equalTo: fabButton.centerYAnchor),
            fabArrow.widthAnchor.constraint(equalToConstant: 18),
            fabArrow.heightAnchor.constraint(equalToConstant: 18),
        ])

        rebuildFABBlur()
    }

    // MARK: - Вспомогательные методы

    @objc private func dismissKeyboard() { view.endEditing(true) }

    private func invalidateSizeCacheIfWidthChanged() {
        let w = collectionView.bounds.width
        guard w > 0, w != sizeCache.layoutWidth else { return }
        sizeCache.invalidateAll()
        collectionView.collectionViewLayout.invalidateLayout()
    }

    // MARK: - Пустое состояние / загрузка

    func updateLoadingState() {
        let isEmpty = sections.isEmpty || sections.allSatisfy { $0.messages.isEmpty }
        emptyStateContainer.isHidden = !isEmpty
        guard isEmpty else { centerSpinner.stopAnimating(); return }

        if isLoading {
            emptyStateLabel.isHidden = true
            centerSpinner.startAnimating()
        } else {
            centerSpinner.stopAnimating()
            emptyStateLabel.isHidden = false
        }
    }

    // MARK: - Публичный API режимов ввода

    func beginReply(info: ReplyInfo) {
        inputBar.beginReply(info: info, theme: theme)
    }

    func beginEdit(messageId: String, text: String) {
        inputBar.beginEdit(messageId: messageId, text: text, theme: theme)
    }

    func clearInputMode() {
        inputBar.cancelMode()
    }

    // MARK: - Поиск сообщения по id

    func message(forID id: String) -> ChatMessage? { messageIndex[id] }
}

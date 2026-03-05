// MARK: - ChatViewController.swift
// Главный контроллер чата.
// Управляет коллекцией сообщений, FAB-кнопкой, пустым состоянием и клавиатурой.
//
// ─── Архитектура клавиатуры ───────────────────────────────────────────────────
//
//  Используем view.keyboardLayoutGuide (iOS 15+) — системный layout guide,
//  который движется покадрово вместе с клавиатурой, в том числе при
//  интерактивном dismiss через свайп вниз (keyboardDismissMode = .interactive).
//
//  Это тот же механизм, что используют Telegram, Instagram, WhatsApp.
//
//  Схема layout:
//
//    ┌─────────────────────────────┐  ← view.top
//    │                             │
//    │      collectionView         │  ← растянут на весь view
//    │  (contentInset.bottom =     │
//    │   inputBar.height)          │
//    │                             │
//    ├─────────────────────────────┤  ← inputBar.top  (= keyboardLayoutGuide.top)
//    │         InputBarView        │
//    ├─────────────────────────────┤  ← keyboardLayoutGuide.top при скрытой KB
//    │  (клавиатура / safe area)   │
//    └─────────────────────────────┘  ← view.bottom
//
//  collectionView занимает весь экран и рисует контент под inputBar.
//  Нижний contentInset равен высоте inputBar — последнее сообщение
//  всегда видно над баром.
//
//  Когда клавиатура поднимается — keyboardLayoutGuide.top поднимается
//  автоматически, inputBar следует за ним, а collectionView получает
//  увеличенный contentInset через наблюдение за изменением frame inputBar.
//
//  Никаких ручных UIView.animate по уведомлениям клавиатуры — всё нативно.
// ──────────────────────────────────────────────────────────────────────────────

import Foundation
import UIKit

// MARK: - ChatViewControllerDelegate

protocol ChatViewControllerDelegate: AnyObject {
    func chatViewController(_ vc: ChatViewController, didScrollToOffset offset: CGPoint)
    func chatViewController(_ vc: ChatViewController, didReachTopThreshold threshold: CGFloat)
    func chatViewController(_ vc: ChatViewController, messagesDidAppear messageIDs: [String])
    func chatViewController(_ vc: ChatViewController, didTapMessage message: ChatMessage)
    func chatViewController(_ vc: ChatViewController, didSelectAction action: MessageAction, for message: ChatMessage)
    func chatViewController(_ vc: ChatViewController, didSendMessage text: String, replyToId: String?)
    func chatViewController(_ vc: ChatViewController, didEditMessage text: String, messageId: String)
    func chatViewController(_ vc: ChatViewController, didCancelReply vc2: ChatViewController)
    func chatViewController(_ vc: ChatViewController, didCancelEdit vc2: ChatViewController)
    func chatViewController(_ vc: ChatViewController, didTapReply replyId: String)
    func chatViewControllerDidTapAttachment(_ vc: ChatViewController)
}

// Дефолтные реализации необязательных методов делегата
extension ChatViewControllerDelegate {
    func chatViewController(_ vc: ChatViewController, didEditMessage text: String, messageId: String) {}
    func chatViewController(_ vc: ChatViewController, didCancelReply vc2: ChatViewController) {}
    func chatViewController(_ vc: ChatViewController, didCancelEdit vc2: ChatViewController) {}
}

// MARK: - ChatScrollPosition

enum ChatScrollPosition {
    case top, center, bottom

    var collectionViewPosition: UICollectionView.ScrollPosition {
        switch self {
        case .top:    return .top
        case .center: return .centeredVertically
        case .bottom: return .bottom
        }
    }
}

// MARK: - ChatViewController

final class ChatViewController: UIViewController {

    // MARK: Public config

    weak var delegate: ChatViewControllerDelegate?
    var actions:   [MessageAction] = []
    var topThreshold: CGFloat = 200
    var isLoading: Bool = false { didSet { updateLoadingState() } }
    var scrollToBottomThreshold: CGFloat = 150 { didSet { updateFABVisibility(animated: false) } }

    /// Активная тема чата. При смене применяется ко всем subviews.
    var theme: ChatTheme = .light { didSet { applyTheme() } }

    // MARK: Initial scroll protection (управляется из RNChatView)

    var isInitialScrollProtected = false
    var pendingScrollMessageId:  String?

    // MARK: Private — data

    private var sections:     [MessageSection]      = []
    /// O(1) lookup по id — обновляется синхронно с sections.
    private var messageIndex: [String: ChatMessage] = [:]

    // MARK: Private — UI

    private var collectionView: UICollectionView!
    private var dataSource: UICollectionViewDiffableDataSource<String, String>!
    private var inputBar: InputBarView!
    private let sizeCache = MessageSizeCache()

    // MARK: Private — empty state

    private let emptyStateContainer = UIView()
    private let emptyStateLabel: UILabel = {
        let l = UILabel()
        l.text          = NSLocalizedString("chat.empty", value: "No messages yet.\nBe the first! 👋", comment: "")
        l.font          = .systemFont(ofSize: 16)
        l.textAlignment = .center
        l.numberOfLines = 0
        return l
    }()
    private let centerSpinner: UIActivityIndicatorView = {
        let s = UIActivityIndicatorView(style: .large)
        s.hidesWhenStopped = true
        return s
    }()

    // MARK: Private — FAB

    private let fabButton: UIButton = {
        let b = UIButton(type: .custom)
        b.backgroundColor        = .clear
        b.alpha                  = 0
        b.isUserInteractionEnabled = false
        b.layer.shadowColor      = UIColor.black.cgColor
        b.layer.shadowOpacity    = 0.18
        b.layer.shadowRadius     = 8
        b.layer.shadowOffset     = CGSize(width: 0, height: 2)
        return b
    }()
    private var fabBlurView: UIVisualEffectView!
    private let fabArrow: UIImageView = {
        let cfg = UIImage.SymbolConfiguration(pointSize: 18, weight: .semibold)
        let iv  = UIImageView(image: UIImage(systemName: "chevron.down", withConfiguration: cfg))
        iv.contentMode = .scaleAspectFit
        return iv
    }()
    private var fabVisible = false

    // MARK: Private — constraints

    /// Constraint inputBar.bottom → keyboardLayoutGuide.top (iOS 15+)
    /// или safeAreaLayoutGuide.bottom + ручной сдвиг (iOS 13–14).
    private var inputBarKeyboardConstraint: NSLayoutConstraint?

    // MARK: Private — state

    private var waitingForNewMessages          = false
    private var lastKnownMessageCount          = 0
    private var lastContentOffsetY: CGFloat    = 0
    private var isProgrammaticScroll           = false
    private var visibleMessageIDs: Set<String> = []
    private var lastSectionsInputHash: Int = 0
    private var lastScrollEventTime: CFTimeInterval = 0
    private let scrollThrottleInterval: CFTimeInterval = 1.0 / 30
    private var pendingHighlightId: String?

    /// true пока пользователь держит палец на экране и тянет коллекцию вниз
    /// чтобы интерактивно скрыть клавиатуру. В этом состоянии мы не трогаем
    /// contentOffset — UIKit сам синхронизирует скролл и движение клавиатуры.
    private var isUserDragging = false

    // MARK: Private — messagesDidAppear debounce

    private var pendingVisibleIDs: Set<String> = []
    private var visibilityDebounceTask: DispatchWorkItem?
    private let visibilityDebounceInterval: TimeInterval = 0.3

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

    deinit { }

    // MARK: - Theme application

    private func applyTheme() {
        guard isViewLoaded else { return }
        collectionView.backgroundColor = theme.collectionViewBackground
        emptyStateLabel.textColor      = theme.emptyStateText
        fabArrow.tintColor             = theme.fabArrowColor

        let newBlur = UIVisualEffectView(effect: UIBlurEffect(style: theme.fabBlurStyle))
        newBlur.translatesAutoresizingMaskIntoConstraints = false
        newBlur.isUserInteractionEnabled = false
        if let old = fabBlurView {
            old.removeFromSuperview()
        }
        fabBlurView = newBlur
        fabButton.insertSubview(fabBlurView, at: 0)
        let size: CGFloat = 40
        NSLayoutConstraint.activate([
            fabBlurView.topAnchor.constraint(equalTo: fabButton.topAnchor),
            fabBlurView.bottomAnchor.constraint(equalTo: fabButton.bottomAnchor),
            fabBlurView.leadingAnchor.constraint(equalTo: fabButton.leadingAnchor),
            fabBlurView.trailingAnchor.constraint(equalTo: fabButton.trailingAnchor),
        ])
        fabBlurView.layer.cornerRadius  = size / 2
        fabBlurView.layer.masksToBounds = true

        inputBar.applyTheme(theme)
        collectionView.reloadData()
    }

    // MARK: - Setup — CollectionView

    private func setupCollectionView() {
        collectionView = UICollectionView(frame: .zero, collectionViewLayout: makeFlowLayout())
        collectionView.backgroundColor     = .clear
        // .interactive — свайп вниз по чату скрывает клавиатуру,
        // inputBar следует покадрово через keyboardLayoutGuide.
        collectionView.keyboardDismissMode = .interactive
        // top: 8px отступ от шапки.
        // bottom: выставляется динамически в updateCollectionBottomInset()
        //         как (view.height - inputBar.minY) — ровно то пространство,
        //         которое занято inputBar + клавиатура.
        collectionView.contentInset = UIEdgeInsets(top: 8, left: 0, bottom: 0, right: 0)
        // .never — мы сами полностью управляем contentInset.bottom через
        // updateCollectionBottomInset(). Дефолтный .automatic заставляет UIKit
        // дополнительно добавлять safeAreaInsets.bottom — это даёт двойной учёт
        // safe area, отсюда лишний зазор между коллекцией и inputBar.
        collectionView.contentInsetAdjustmentBehavior = .never
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        collectionView.register(MessageCell.self,
            forCellWithReuseIdentifier: MessageCell.reuseID)
        collectionView.register(DateSeparatorView.self,
            forSupplementaryViewOfKind: UICollectionView.elementKindSectionHeader,
            withReuseIdentifier: DateSeparatorView.reuseID)
        collectionView.delegate = self
        view.addSubview(collectionView)

        // collectionView занимает весь view. Нижний contentInset создаёт
        // "виртуальный" отступ под inputBar — последнее сообщение всегда видно.
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

        // ── iOS 15+: keyboardLayoutGuide ──────────────────────────────────────
        // Системный layout guide синхронизирован с клавиатурой на уровне CADisplayLink.
        // Работает для:
        //   • Появления / скрытия клавиатуры
        //   • Интерактивного dismiss свайпом (keyboardDismissMode = .interactive)
        //   • Смены высоты клавиатуры (emoji, QuickType bar, etc.)
        //   • Floating keyboard на iPad
        //   • Split-screen / Stage Manager
        if #available(iOS 15.0, *) {
            // followsUndockedKeyboard = true позволяет inputBar следовать
            // за floating-клавиатурой на iPad. На iPhone не влияет.
            view.keyboardLayoutGuide.followsUndockedKeyboard = true

            let constraint = inputBar.bottomAnchor.constraint(
                equalTo: view.keyboardLayoutGuide.topAnchor
            )
            constraint.isActive = true
            inputBarKeyboardConstraint = constraint
        } else {
            // ── Fallback iOS 13–14 ────────────────────────────────────────────
            // На старых iOS keyboardLayoutGuide недоступен.
            // Крепим к safeAreaLayoutGuide.bottom и слушаем уведомления
            // клавиатуры через KeyboardListener.
            let constraint = inputBar.bottomAnchor.constraint(
                equalTo: view.safeAreaLayoutGuide.bottomAnchor
            )
            constraint.isActive = true
            inputBarKeyboardConstraint = constraint
            KeyboardListener.shared.add(delegate: self)
        }
    }

    // MARK: - CollectionView inset management

    /// Вычисляет и применяет правильный contentInset.bottom для коллекции.
    ///
    /// Принцип: collectionView занимает весь экран (bottomAnchor = view.bottomAnchor).
    /// Нижний contentInset = расстояние от низа view до верха inputBar.
    /// Это гарантирует что последнее сообщение всегда видно над inputBar.
    ///
    /// viewDidLayoutSubviews вызывается в каждом кадре анимации keyboardLayoutGuide,
    /// поэтому inset обновляется покадрово вместе с движением клавиатуры.
    private func updateCollectionBottomInset() {
        guard inputBar.frame.height > 0, view.bounds.height > 0 else { return }

        let newBottom = view.bounds.height - inputBar.frame.minY
        let oldBottom = collectionView.contentInset.bottom
        guard abs(oldBottom - newBottom) > 0.5 else { return }

        let cv = collectionView!

        // Во время интерактивного dismiss пользователь тянет коллекцию пальцем.
        // UIKit сам двигает contentOffset синхронно с клавиатурой через
        // keyboardDismissMode = .interactive. Мы не вмешиваемся — иначе
        // два источника движения offset создадут дёрганье.
        if isUserDragging {
            cv.contentInset.bottom = newBottom
            cv.scrollIndicatorInsets.bottom = newBottom
            return
        }

        // Сохраняем расстояние от текущего contentOffset до конца контента.
        // После смены inset восстанавливаем его — так сообщения
        // "поднимаются" вместе с клавиатурой без прыжков.
        let distanceFromEnd = cv.contentSize.height
            - cv.contentOffset.y
            - cv.bounds.height
            + oldBottom

        cv.contentInset.bottom = newBottom
        cv.scrollIndicatorInsets.bottom = newBottom

        let newOffsetY = cv.contentSize.height
            - cv.bounds.height
            + newBottom
            - distanceFromEnd

        let minOffsetY = -cv.contentInset.top
        cv.contentOffset = CGPoint(x: 0, y: max(minOffsetY, newOffsetY))
    }

    // MARK: - Setup — FAB

    private func setupFAB() {
        let size: CGFloat = 40
        fabBlurView = UIVisualEffectView(effect: UIBlurEffect(style: theme.fabBlurStyle))
        fabBlurView.translatesAutoresizingMaskIntoConstraints = false
        fabBlurView.isUserInteractionEnabled = false
        fabArrow.translatesAutoresizingMaskIntoConstraints = false
        fabArrow.isUserInteractionEnabled = false

        fabButton.translatesAutoresizingMaskIntoConstraints = false
        fabButton.addSubview(fabBlurView)
        fabButton.addSubview(fabArrow)
        view.addSubview(fabButton)

        NSLayoutConstraint.activate([
            fabButton.widthAnchor.constraint(equalToConstant: size),
            fabButton.heightAnchor.constraint(equalToConstant: size),
            fabButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            // FAB всегда над inputBar, независимо от положения клавиатуры
            fabButton.bottomAnchor.constraint(equalTo: inputBar.topAnchor, constant: -12),
            fabBlurView.topAnchor.constraint(equalTo: fabButton.topAnchor),
            fabBlurView.bottomAnchor.constraint(equalTo: fabButton.bottomAnchor),
            fabBlurView.leadingAnchor.constraint(equalTo: fabButton.leadingAnchor),
            fabBlurView.trailingAnchor.constraint(equalTo: fabButton.trailingAnchor),
            fabArrow.centerXAnchor.constraint(equalTo: fabButton.centerXAnchor),
            fabArrow.centerYAnchor.constraint(equalTo: fabButton.centerYAnchor),
            fabArrow.widthAnchor.constraint(equalToConstant: 18),
            fabArrow.heightAnchor.constraint(equalToConstant: 18),
        ])
        fabButton.layer.cornerRadius   = size / 2
        fabButton.layer.masksToBounds  = false
        fabBlurView.layer.cornerRadius = size / 2
        fabBlurView.layer.masksToBounds = true
        fabButton.addTarget(self, action: #selector(fabTapped), for: .touchUpInside)
    }

    // MARK: - Setup — DataSource

    private func setupDataSource() {
        dataSource = UICollectionViewDiffableDataSource<String, String>(
            collectionView: collectionView
        ) { [weak self] cv, ip, id in
            self?.cell(for: ip, id: id, in: cv)
        }

        dataSource.supplementaryViewProvider = { [weak self] cv, kind, ip in
            guard kind == UICollectionView.elementKindSectionHeader,
                  let self else { return nil }
            let v = cv.dequeueReusableSupplementaryView(
                ofKind: kind,
                withReuseIdentifier: DateSeparatorView.reuseID,
                for: ip
            ) as? DateSeparatorView
            v?.configure(
                with: DateHelper.shared.sectionTitle(from: sections[ip.section].dateKey),
                theme: theme
            )
            return v
        }
    }

    // MARK: - Cell factory

    private func cell(for ip: IndexPath, id: String, in cv: UICollectionView) -> UICollectionViewCell? {
        guard let msg = messageIndex[id] else { return nil }
        let cell = cv.dequeueReusableCell(
            withReuseIdentifier: MessageCell.reuseID, for: ip) as? MessageCell
        cell?.configure(
            with: msg,
            resolvedReply: resolve(msg),
            collectionViewWidth: cv.bounds.width,
            theme: theme
        )
        cell?.onReplyTap = { [weak self] replyId in
            guard let self else { return }
            delegate?.chatViewController(self, didTapReply: replyId)
        }
        return cell
    }

    // MARK: - Layout

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()

        // Обновляем нижний inset коллекции в каждом кадре layout-прохода.
        // keyboardLayoutGuide двигает inputBar покадрово → inputBar.frame.minY меняется
        // → здесь мы пересчитываем contentInset.bottom = view.height - inputBar.minY.
        updateCollectionBottomInset()

        let w = collectionView.bounds.width
        if w > 0, w != sizeCache.layoutWidth {
            sizeCache.invalidateAll()
            collectionView.collectionViewLayout.invalidateLayout()
        }
    }

    private func makeFlowLayout() -> UICollectionViewFlowLayout {
        let l = UICollectionViewFlowLayout()
        l.scrollDirection               = .vertical
        l.minimumLineSpacing            = ChatLayoutConstants.lineSpacing
        l.minimumInteritemSpacing       = 0
        l.sectionHeadersPinToVisibleBounds = true
        return l
    }

    @objc private func dismissKeyboard() { view.endEditing(true) }

    // MARK: - FAB

    @objc private func fabTapped() { scrollToBottom(animated: true) }

    private func updateFABVisibility(animated: Bool) {
        let show = distanceFromBottom() > scrollToBottomThreshold
        guard show != fabVisible else { return }
        fabVisible = show
        fabButton.isUserInteractionEnabled = show
        let alpha: CGFloat = show ? 1 : 0
        let scale: CGFloat = show ? 1 : 0.7
        if animated {
            UIView.animate(withDuration: 0.22, delay: 0,
                           usingSpringWithDamping: 0.7, initialSpringVelocity: 0.3,
                           options: .allowUserInteraction) {
                self.fabButton.alpha     = alpha
                self.fabButton.transform = CGAffineTransform(scaleX: scale, y: scale)
            }
        } else {
            fabButton.alpha     = alpha
            fabButton.transform = CGAffineTransform(scaleX: scale, y: scale)
        }
    }

    private func distanceFromBottom() -> CGFloat {
        let cv = collectionView!
        // Расстояние от текущей позиции скролла до конца контента
        return max(0, cv.contentSize.height
            - cv.contentOffset.y
            - cv.bounds.height
            + cv.contentInset.bottom)
    }

    // MARK: - Reply resolution

    private func resolve(_ message: ChatMessage) -> ResolvedReply? {
        guard let reply = message.reply else { return nil }
        if let original = messageIndex[reply.replyToId] {
            return .found(ReplyDisplayInfo(from: original))
        }
        return .deleted
    }

    private func replyExists(for message: ChatMessage) -> Bool {
        guard let id = message.reply?.replyToId else { return false }
        return messageIndex[id] != nil
    }
}

// MARK: - KeyboardListenerDelegate (iOS 13–14 fallback only)

extension ChatViewController: KeyboardListenerDelegate {

    /// Вызывается только на iOS 13–14.
    /// На iOS 15+ keyboardLayoutGuide двигает inputBar покадрово автоматически,
    /// а updateCollectionBottomInset() в viewDidLayoutSubviews подхватывает это.
    func keyboardWillChangeFrame(info: KeyboardInfo) {
        guard #unavailable(iOS 15) else { return }
        guard let window = view.window else { return }

        let kbInView   = view.convert(info.frameEnd, from: window.screen.coordinateSpace)
        let kbHeight   = max(0, view.bounds.height - kbInView.origin.y)
        let safeBottom = view.safeAreaInsets.bottom
        // Сдвигаем inputBar вверх на высоту клавиатуры над safe area
        let newConst   = -(max(kbHeight, safeBottom) - safeBottom)

        guard (inputBarKeyboardConstraint?.constant ?? 0) != newConst else { return }
        inputBarKeyboardConstraint?.constant = newConst

        let curve = UIView.AnimationOptions(rawValue: UInt(info.animationCurve.rawValue) << 16)

        if info.animationDuration > 0 {
            UIView.animate(
                withDuration: info.animationDuration,
                delay: 0,
                options: [curve, .beginFromCurrentState]
            ) {
                // layoutIfNeeded → viewDidLayoutSubviews → updateCollectionBottomInset
                // inset и offset обновятся синхронно внутри этого анимационного блока
                self.view.layoutIfNeeded()
            }
        } else {
            view.layoutIfNeeded()
        }
    }
}

// MARK: - Public API

extension ChatViewController {

    // MARK: Messages update

    func updateMessages(_ messages: [ChatMessage]) {
        let newCount    = messages.count
        let oldCount    = lastKnownMessageCount
        let newSections = buildSections(from: messages)
        let newIndex    = Dictionary(uniqueKeysWithValues: messages.map { ($0.id, $0) })

        if newCount > oldCount && oldCount > 0 && isPrepend(newSections: newSections) {
            applyPrepend(newSections: newSections, newIndex: newIndex, messages: messages)
        } else if newCount < oldCount {
            applyDeletion(newSections: newSections, newIndex: newIndex)
        } else if newCount > oldCount {
            applyAppend(newSections: newSections, newIndex: newIndex, messages: messages)
        } else {
            applyUpdate(newSections: newSections, newIndex: newIndex, messages: messages)
        }

        updateLoadingState()
        updateFABVisibility(animated: false)
        if waitingForNewMessages && newCount > oldCount { waitingForNewMessages = false }
        lastKnownMessageCount = newCount
    }

    func resetLoadingState() { waitingForNewMessages = false }

    // MARK: Reply / Edit

    func beginReply(info: ReplyInfo) {
        inputBar?.beginReply(info: info, theme: theme)
    }

    func beginEdit(messageId: String, text: String) {
        inputBar?.beginEdit(messageId: messageId, text: text, theme: theme)
    }

    func clearInputMode() {
        inputBar?.cancelMode()
    }

    // MARK: Scroll API

    func scrollToBottom(animated: Bool) {
        guard let last = sections.last, !last.messages.isEmpty else { return }
        if collectionView.contentSize.height <= 0 { collectionView.layoutIfNeeded() }
        collectionView.scrollToItem(
            at: IndexPath(item: last.messages.count - 1, section: sections.count - 1),
            at: .bottom, animated: animated)
    }

    func scrollToMessage(
        id: String,
        position: ChatScrollPosition = .center,
        animated: Bool = true,
        highlight: Bool = true
    ) {
        guard let ip = indexPath(forMessageID: id) else { return }

        if collectionView.indexPathsForVisibleItems.contains(ip) {
            if highlight {
                DispatchQueue.main.async { [weak self] in self?.highlightMessage(id: id) }
            }
            collectionView.scrollToItem(at: ip, at: position.collectionViewPosition, animated: animated)
            return
        }

        collectionView.scrollToItem(at: ip, at: position.collectionViewPosition, animated: animated)
        guard highlight else { return }

        if animated {
            pendingHighlightId = id
        } else {
            DispatchQueue.main.async { [weak self] in self?.highlightMessage(id: id) }
        }
    }

    func message(forID id: String) -> ChatMessage? { messageIndex[id] }
}

// MARK: - UICollectionViewDelegate

extension ChatViewController: UICollectionViewDelegate {

    func collectionView(_ cv: UICollectionView, didSelectItemAt ip: IndexPath) {
        guard let id  = dataSource.itemIdentifier(for: ip),
              let msg = messageIndex[id] else { return }
        delegate?.chatViewController(self, didTapMessage: msg)
    }

    func collectionView(
        _ cv: UICollectionView,
        contextMenuConfigurationForItemAt ip: IndexPath,
        point: CGPoint
    ) -> UIContextMenuConfiguration? {
        guard !actions.isEmpty,
              let id  = dataSource.itemIdentifier(for: ip),
              let msg = messageIndex[id] else { return nil }

        let identifier = NSString(string: id)

        return UIContextMenuConfiguration(
            identifier: identifier,
            previewProvider: { [weak self] in
                guard let self,
                      let ip   = indexPath(forMessageID: msg.id),
                      let cell = cv.cellForItem(at: ip) as? MessageCell
                else { return nil }

                return cell.makeBubblePreviewController()
            },
            actionProvider: { [weak self] _ in
                self?.makeContextMenu(for: msg)
            }
        )
    }

    func collectionView(
        _ cv: UICollectionView,
        willPerformPreviewActionForMenuWith config: UIContextMenuConfiguration,
        animator: UIContextMenuInteractionCommitAnimating
    ) {
        animator.preferredCommitStyle = .dismiss
    }

    func collectionView(
        _ cv: UICollectionView,
        previewForHighlightingContextMenuWithConfiguration config: UIContextMenuConfiguration
    ) -> UITargetedPreview? {
        targetedPreview(for: config, in: cv)
    }

    func collectionView(
        _ cv: UICollectionView,
        previewForDismissingContextMenuWithConfiguration config: UIContextMenuConfiguration
    ) -> UITargetedPreview? {
        targetedPreview(for: config, in: cv)
    }

    private func targetedPreview(
        for config: UIContextMenuConfiguration,
        in cv: UICollectionView
    ) -> UITargetedPreview? {
        guard
            let id   = config.identifier as? String,
            let ip   = indexPath(forMessageID: id),
            let cell = cv.cellForItem(at: ip) as? MessageCell
        else { return nil }

        return cell.makeTargetedPreview()
    }

    func collectionView(
        _ cv: UICollectionView,
        willDisplay cell: UICollectionViewCell,
        forItemAt ip: IndexPath
    ) {
        guard let id  = dataSource.itemIdentifier(for: ip),
              let msg = messageIndex[id],
              !msg.isMine else { return }
        guard visibleMessageIDs.insert(id).inserted else { return }
        scheduleVisibilityFlush(id: id)
    }

    func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
        isUserDragging = true
    }

    func scrollViewDidEndDragging(_ scrollView: UIScrollView, willDecelerate decelerate: Bool) {
        if !decelerate { isUserDragging = false }
    }

    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
        isUserDragging = false
        processPendingHighlight()
    }

    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        let offset = scrollView.contentOffset
        let dy     = offset.y - lastContentOffsetY
        lastContentOffsetY = offset.y

        updateFABVisibility(animated: true)
        guard !isProgrammaticScroll else { return }

        let now = CACurrentMediaTime()
        if now - lastScrollEventTime >= scrollThrottleInterval {
            lastScrollEventTime = now
            delegate?.chatViewController(self, didScrollToOffset: offset)
        }

        let topDist = offset.y + scrollView.contentInset.top
        if dy < 0, topDist < topThreshold, !waitingForNewMessages {
            waitingForNewMessages = true
            delegate?.chatViewController(self, didReachTopThreshold: topDist)
        }
    }

    func scrollViewDidEndScrollingAnimation(_ scrollView: UIScrollView) {
        processPendingHighlight()
    }
}

// MARK: - UICollectionViewDelegateFlowLayout

extension ChatViewController: UICollectionViewDelegateFlowLayout {

    func collectionView(
        _ cv: UICollectionView,
        layout: UICollectionViewLayout,
        sizeForItemAt ip: IndexPath
    ) -> CGSize {
        guard let id  = dataSource.itemIdentifier(for: ip),
              let msg = messageIndex[id] else {
            return CGSize(width: cv.bounds.width, height: 44)
        }
        return sizeCache.size(
            for: msg,
            hasReply: replyExists(for: msg),
            collectionViewWidth: cv.bounds.width
        )
    }

    func collectionView(
        _ cv: UICollectionView,
        layout: UICollectionViewLayout,
        referenceSizeForHeaderInSection section: Int
    ) -> CGSize {
        CGSize(width: cv.bounds.width, height: 36)
    }

    func collectionView(
        _ cv: UICollectionView,
        layout: UICollectionViewLayout,
        insetForSectionAt section: Int
    ) -> UIEdgeInsets { .zero }
}

// MARK: - InputBarDelegate

extension ChatViewController: InputBarDelegate {

    func inputBar(_ bar: InputBarView, didSendText text: String, replyToId: String?) {
        delegate?.chatViewController(self, didSendMessage: text, replyToId: replyToId)
    }

    func inputBar(_ bar: InputBarView, didEditText text: String, messageId: String) {
        delegate?.chatViewController(self, didEditMessage: text, messageId: messageId)
    }

    func inputBarDidCancelReply(_ bar: InputBarView) {
        delegate?.chatViewController(self, didCancelReply: self)
    }

    func inputBarDidCancelEdit(_ bar: InputBarView) {
        delegate?.chatViewController(self, didCancelEdit: self)
    }

    func inputBar(_ bar: InputBarView, didChangeHeight height: CGFloat) {
        // Высота inputBar изменилась (мультистрок, reply panel, режим редактирования).
        // layoutIfNeeded внутри аниматора запустит layout pass →
        // viewDidLayoutSubviews → updateCollectionBottomInset пересчитает
        // contentInset.bottom и скорректирует contentOffset без прыжка.
        UIViewPropertyAnimator(duration: 0.25, dampingRatio: 0.85) { [weak self] in
            self?.view.layoutIfNeeded()
        }.startAnimation()
    }

    func inputBarDidTapAttachment(_ bar: InputBarView) {
        delegate?.chatViewControllerDidTapAttachment(self)
    }
}

// MARK: - Context menu

extension ChatViewController {

    func makeContextMenu(for message: ChatMessage) -> UIMenu {
        UIMenu(title: "", children: actions.map { a in
            UIAction(
                title: a.title,
                image: a.systemImage.flatMap { UIImage(systemName: $0) },
                attributes: a.isDestructive ? .destructive : []
            ) { [weak self] _ in
                guard let self else { return }
                delegate?.chatViewController(self, didSelectAction: a, for: message)
            }
        })
    }
}

// MARK: - Message update helpers

private extension ChatViewController {

    func applyPrepend(
        newSections: [MessageSection],
        newIndex: [String: ChatMessage],
        messages: [ChatMessage]
    ) {
        sections     = newSections
        messageIndex = newIndex
        warmCache(for: messages, width: collectionView.bounds.width)

        CATransaction.begin()
        CATransaction.setDisableActions(true)
        let oldH = collectionView.contentSize.height
        let oldY = collectionView.contentOffset.y
        dataSource.apply(buildSnapshot(), animatingDifferences: false)
        collectionView.layoutIfNeeded()

        if !isInitialScrollProtected {
            let delta = collectionView.contentSize.height - oldH
            isProgrammaticScroll = true
            collectionView.contentOffset = CGPoint(
                x: 0, y: max(-collectionView.contentInset.top, oldY + delta))
            isProgrammaticScroll = false
        } else if let targetId = pendingScrollMessageId {
            isProgrammaticScroll = true
            if let ip = indexPath(forMessageID: targetId) {
                collectionView.scrollToItem(at: ip, at: .centeredVertically, animated: false)
            }
            isProgrammaticScroll = false
        }
        CATransaction.commit()
    }

    func applyDeletion(
        newSections: [MessageSection],
        newIndex: [String: ChatMessage]
    ) {
        let removedIDs = Set(messageIndex.keys).subtracting(newIndex.keys)
        sections     = newSections
        messageIndex = newIndex

        let replyingIDs: [String] = sections.flatMap(\.messages).compactMap { msg in
            guard let rid = msg.reply?.replyToId, removedIDs.contains(rid) else { return nil }
            return msg.id
        }
        sizeCache.invalidate(ids: removedIDs)
        sizeCache.invalidate(ids: replyingIDs)

        var snap = buildSnapshot()
        if !replyingIDs.isEmpty { snap.reloadItems(replyingIDs) }
        dataSource.apply(snap, animatingDifferences: true)
    }

    func applyAppend(
        newSections: [MessageSection],
        newIndex: [String: ChatMessage],
        messages: [ChatMessage]
    ) {
        sections     = newSections
        messageIndex = newIndex
        warmCache(for: messages, width: collectionView.bounds.width)
        dataSource.apply(buildSnapshot(), animatingDifferences: true) { [weak self] in
            self?.scrollToBottomIfNearBottom()
        }
    }

    func applyUpdate(
        newSections: [MessageSection],
        newIndex: [String: ChatMessage],
        messages: [ChatMessage]
    ) {
        let changedIDs = messages.compactMap { msg -> String? in
            guard let old = messageIndex[msg.id] else { return msg.id }
            return old == msg ? nil : msg.id
        }
        sections     = newSections
        messageIndex = newIndex

        guard !changedIDs.isEmpty else { return }

        let changedSet = Set(changedIDs)
        let quoteReaderIDs = sections.flatMap(\.messages).compactMap { msg -> String? in
            guard let rid = msg.reply?.replyToId,
                  changedSet.contains(rid),
                  !changedSet.contains(msg.id) else { return nil }
            return msg.id
        }

        let allToReconfigure = changedIDs + quoteReaderIDs
        sizeCache.invalidate(ids: allToReconfigure)
        var snap = dataSource.snapshot()
        snap.reconfigureItems(allToReconfigure)
        dataSource.apply(snap, animatingDifferences: false)
    }

    // MARK: Cache warmup

    func warmCache(for messages: [ChatMessage], width: CGFloat) {
        guard width > 0 else { return }
        let uncached = messages.filter { !sizeCache.contains($0.id) }
        guard !uncached.isEmpty else { return }

        let hasReplyMap: [String: Bool] = Dictionary(
            uniqueKeysWithValues: uncached.map { ($0.id, replyExists(for: $0)) }
        )
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.sizeCache.prefill(
                messages: uncached,
                hasReplyMap: hasReplyMap,
                collectionViewWidth: width
            )
        }
    }

    // MARK: Sections building

    func buildSections(from messages: [ChatMessage]) -> [MessageSection] {
        let newHash = messages.reduce(into: 0) { h, m in
            h ^= m.id.hashValue &+ m.status.hashValue &+ m.groupDate.hashValue
        }
        if newHash == lastSectionsInputHash && !sections.isEmpty { return sections }
        lastSectionsInputHash = newHash

        var map:   [String: MessageSection] = [:]
        var order: [String] = []
        for msg in messages.sorted(by: { $0.timestamp < $1.timestamp }) {
            if map[msg.groupDate] == nil {
                map[msg.groupDate] = MessageSection(dateKey: msg.groupDate, messages: [])
                order.append(msg.groupDate)
            }
            map[msg.groupDate]?.messages.append(msg)
        }
        return order.compactMap { map[$0] }
    }

    func buildSnapshot() -> NSDiffableDataSourceSnapshot<String, String> {
        var snap = NSDiffableDataSourceSnapshot<String, String>()
        for s in sections {
            snap.appendSections([s.dateKey])
            snap.appendItems(s.messages.map(\.id), toSection: s.dateKey)
        }
        return snap
    }

    func isPrepend(newSections: [MessageSection]) -> Bool {
        guard let oldest = sections.first?.messages.first?.timestamp else { return false }
        let all   = newSections.flatMap { $0.messages.map(\.timestamp) }
        let added = all.count - lastKnownMessageCount
        guard added > 0 else { return false }
        return all.prefix(added).allSatisfy { $0 < oldest }
    }

    func scrollToBottomIfNearBottom() {
        guard distanceFromBottom() < scrollToBottomThreshold + 50 else { return }
        scrollToBottom(animated: true)
    }

    // MARK: Empty / Loading state

    func updateLoadingState() {
        let empty = sections.isEmpty || sections.allSatisfy { $0.messages.isEmpty }
        emptyStateContainer.isHidden = !empty
        if empty {
            if isLoading {
                emptyStateLabel.isHidden = true; centerSpinner.startAnimating()
            } else {
                centerSpinner.stopAnimating(); emptyStateLabel.isHidden = false
            }
        } else {
            centerSpinner.stopAnimating()
        }
    }

    // MARK: Highlight

    func processPendingHighlight() {
        guard let id = pendingHighlightId else { return }
        pendingHighlightId = nil
        highlightMessage(id: id)
    }

    func highlightMessage(id: String) {
        guard let ip = indexPath(forMessageID: id) else { return }
        if let cell = collectionView.cellForItem(at: ip) as? MessageCell {
            cell.highlight(); return
        }
        DispatchQueue.main.async { [weak self] in
            guard let self, let ip = self.indexPath(forMessageID: id) else { return }
            (self.collectionView.cellForItem(at: ip) as? MessageCell)?.highlight()
        }
    }

    // MARK: Index helpers

    func indexPath(forMessageID id: String) -> IndexPath? {
        for (si, section) in sections.enumerated() {
            if let ii = section.messages.firstIndex(where: { $0.id == id }) {
                return IndexPath(item: ii, section: si)
            }
        }
        return nil
    }

    // MARK: Debounce flush

    private func scheduleVisibilityFlush(id: String) {
        pendingVisibleIDs.insert(id)

        visibilityDebounceTask?.cancel()

        let task = DispatchWorkItem { [weak self] in
            guard let self, !pendingVisibleIDs.isEmpty else { return }
            let batch = Array(pendingVisibleIDs)
            pendingVisibleIDs.removeAll()
            delegate?.chatViewController(self, messagesDidAppear: batch)
        }
        visibilityDebounceTask = task
        DispatchQueue.main.asyncAfter(
            deadline: .now() + visibilityDebounceInterval,
            execute: task
        )
    }
}

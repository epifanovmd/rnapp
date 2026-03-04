// MARK: - ChatViewController.swift
// Главный контроллер чата.
// Управляет коллекцией сообщений, FAB-кнопкой, пустым состоянием и клавиатурой.
// Бизнес-логика вынесена в делегат; контроллер отвечает только за UI.

import UIKit

// MARK: - ChatViewControllerDelegate

protocol ChatViewControllerDelegate: AnyObject {
    func chatViewController(_ vc: ChatViewController, didScrollToOffset offset: CGPoint)
    func chatViewController(_ vc: ChatViewController, didReachTopThreshold threshold: CGFloat)
    func chatViewController(_ vc: ChatViewController, messagesDidAppear messageIDs: [String])
    func chatViewController(_ vc: ChatViewController, didTapMessage message: ChatMessage)
    func chatViewController(_ vc: ChatViewController, didSelectAction action: MessageAction, for message: ChatMessage)
    func chatViewController(_ vc: ChatViewController, didSendMessage text: String, replyToId: String?)
    func chatViewController(_ vc: ChatViewController, didTapReply replyId: String)
    func chatViewControllerDidTapAttachment(_ vc: ChatViewController)
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

    private var inputBarBottomConstraint:       NSLayoutConstraint!
    private var collectionViewBottomConstraint: NSLayoutConstraint!
    private var emptyStateBottomConstraint:     NSLayoutConstraint!

    // MARK: Private — state

    private var keyboardHeight:     CGFloat    = 0
    private var waitingForNewMessages          = false
    private var lastKnownMessageCount          = 0
    private var lastContentOffsetY: CGFloat    = 0
    private var isProgrammaticScroll           = false
    private var visibleMessageIDs: Set<String> = []
    private var replyInfo: ReplyInfo? { didSet { inputBar?.setReplyInfo(replyInfo, theme: theme) } }
    private var lastSectionsInputHash: Int = 0
    private var lastScrollEventTime: CFTimeInterval = 0
    private let scrollThrottleInterval: CFTimeInterval = 1.0 / 30
    private var pendingHighlightId: String?

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        setupCollectionView()
        setupEmptyState()
        setupInputBar()
        setupFAB()
        setupDataSource()
        setupKeyboardObservers()
        applyTheme()
    }

    deinit { NotificationCenter.default.removeObserver(self) }

    // MARK: - Theme application

    /// Применяет текущую тему ко всем компонентам.
    private func applyTheme() {
        guard isViewLoaded else { return }
        collectionView.backgroundColor = theme.collectionViewBackground
        emptyStateLabel.textColor      = theme.emptyStateText
        fabArrow.tintColor             = theme.fabArrowColor

        // Пересоздаём blur-эффект с нужным стилем
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
        collectionView.keyboardDismissMode = .interactive
        collectionView.contentInset        = UIEdgeInsets(top: 8, left: 0, bottom: 8, right: 0)
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        collectionView.register(MessageCell.self,
            forCellWithReuseIdentifier: MessageCell.reuseID)
        collectionView.register(DateSeparatorView.self,
            forSupplementaryViewOfKind: UICollectionView.elementKindSectionHeader,
            withReuseIdentifier: DateSeparatorView.reuseID)
        collectionView.delegate = self
        view.addSubview(collectionView)

        collectionViewBottomConstraint = collectionView.bottomAnchor
            .constraint(equalTo: view.bottomAnchor)
        NSLayoutConstraint.activate([
            collectionView.topAnchor.constraint(equalTo: view.topAnchor),
            collectionView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            collectionView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            collectionViewBottomConstraint,
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

        emptyStateBottomConstraint = emptyStateContainer.bottomAnchor
            .constraint(equalTo: view.bottomAnchor)
        NSLayoutConstraint.activate([
            emptyStateContainer.topAnchor.constraint(equalTo: view.topAnchor),
            emptyStateContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            emptyStateContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            emptyStateBottomConstraint,
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

        inputBarBottomConstraint = inputBar.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        NSLayoutConstraint.activate([
            inputBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            inputBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            inputBar.heightAnchor.constraint(greaterThanOrEqualToConstant: 52),
            inputBarBottomConstraint,
        ])

        collectionViewBottomConstraint.isActive = false
        collectionViewBottomConstraint = collectionView.bottomAnchor
            .constraint(equalTo: inputBar.topAnchor)
        collectionViewBottomConstraint.isActive = true

        emptyStateBottomConstraint.isActive = false
        emptyStateBottomConstraint = emptyStateContainer.bottomAnchor
            .constraint(equalTo: inputBar.topAnchor)
        emptyStateBottomConstraint.isActive = true
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

    /// Вытаскивает ячейку из пула и заполняет данными сообщения.
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
        if keyboardHeight == 0 {
            let safe = view.safeAreaInsets.bottom
            if inputBarBottomConstraint.constant != -safe {
                inputBarBottomConstraint.constant = -safe
            }
        }
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

    /// Показывает/скрывает FAB с spring-анимацией.
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
        return max(0, cv.contentSize.height - cv.contentOffset.y - cv.bounds.height)
    }

    // MARK: - Keyboard

    private func setupKeyboardObservers() {
        NotificationCenter.default.addObserver(
            self, selector: #selector(keyboardWillChangeFrame(_:)),
            name: UIResponder.keyboardWillChangeFrameNotification, object: nil)
    }

    @objc private func keyboardWillChangeFrame(_ note: Notification) {
        guard
            let endFrame = note.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect,
            let duration = note.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double,
            let curveRaw = note.userInfo?[UIResponder.keyboardAnimationCurveUserInfoKey] as? UInt,
            let window   = view.window
        else { return }

        let kbInView = view.convert(endFrame, from: window.screen.coordinateSpace)
        let newKbH   = max(0, view.bounds.height - kbInView.origin.y)
        guard newKbH != keyboardHeight else { return }
        keyboardHeight = newKbH

        let safe       = view.safeAreaInsets.bottom
        let newConst   = newKbH > 0 ? -newKbH : -safe
        let distBottom = collectionView.contentSize.height
            - collectionView.contentOffset.y - collectionView.bounds.height

        let updates = {
            self.inputBarBottomConstraint.constant = newConst
            self.view.layoutIfNeeded()
            let off = self.collectionView.contentSize.height
                    - self.collectionView.bounds.height - distBottom
            if off > -self.collectionView.contentInset.top {
                self.collectionView.contentOffset = CGPoint(x: 0, y: off)
            }
        }

        if duration > 0 {
            UIView.animate(withDuration: duration, delay: 0,
                options: UIView.AnimationOptions(rawValue: curveRaw << 16).union(.allowUserInteraction),
                animations: updates)
        } else { updates() }
    }

    // MARK: - Reply resolution

    /// Резолвит цитату сообщения из локального messageIndex.
    private func resolve(_ message: ChatMessage) -> ResolvedReply? {
        guard let reply = message.reply else { return nil }
        guard messageIndex[reply.replyToId] != nil else { return .deleted }
        return .found(reply)
    }

    private func replyExists(for message: ChatMessage) -> Bool {
        guard let id = message.reply?.replyToId else { return false }
        return messageIndex[id] != nil
    }
}

// MARK: - Public API

extension ChatViewController {

    // MARK: Messages update

    /// Полный апдейт списка сообщений с определением типа изменения (prepend / delete / append / update).
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

    // MARK: Reply

    func setReplyInfo(_ info: ReplyInfo?) {
        replyInfo = info
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
            // Сообщение уже видно — только подсветить
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

// MARK: - Message update helpers

private extension ChatViewController {

    /// Добавление истории сверху (prepend) без прыжка scroll.
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

    /// Удаление сообщений с анимацией.
    func applyDeletion(
        newSections: [MessageSection],
        newIndex: [String: ChatMessage]
    ) {
        let removedIDs = Set(messageIndex.keys).subtracting(newIndex.keys)
        sections     = newSections
        messageIndex = newIndex

        // Инвалидируем кэш для удалённых и их ответов
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

    /// Добавление новых сообщений снизу.
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

    /// Обновление существующих сообщений (статус, текст).
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
        sizeCache.invalidate(ids: changedIDs)
        var snap = dataSource.snapshot()
        snap.reconfigureItems(changedIDs)
        dataSource.apply(snap, animatingDifferences: false)
    }

    // MARK: Cache warmup

    /// Прогревает кэш размеров в фоновом потоке для списка сообщений.
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

    /// Группирует сообщения по дате в секции. Использует хэш для пропуска лишних пересчётов.
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

    /// Возвращает true, если новые секции содержат сообщения старше самого раннего в текущем списке.
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

    /// Обрабатывает отложенную подсветку после завершения scroll-анимации.
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

    // MARK: Context menu

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
        return UIContextMenuConfiguration(identifier: nil, previewProvider: nil) { [weak self] _ in
            self?.makeContextMenu(for: msg) ?? UIMenu()
        }
    }

    func collectionView(
        _ cv: UICollectionView,
        willDisplay cell: UICollectionViewCell,
        forItemAt ip: IndexPath
    ) {
        guard let id  = dataSource.itemIdentifier(for: ip),
              let msg = messageIndex[id],
              !msg.isMine else { return }
        if visibleMessageIDs.insert(id).inserted {
            delegate?.chatViewController(self, messagesDidAppear: [id])
        }
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

    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
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

    func inputBar(_ bar: InputBarView, didChangeHeight height: CGFloat) {
        UIView.animate(withDuration: 0.2) { self.view.layoutIfNeeded() }
    }

    func inputBarDidTapAttachment(_ bar: InputBarView) {
        delegate?.chatViewControllerDidTapAttachment(self)
    }
}

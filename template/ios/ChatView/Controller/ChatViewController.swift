import IGListKit
import UIKit

final class ChatViewController: UIViewController {

    // MARK: - Public Properties

    weak var delegate: ChatViewControllerDelegate?

    var theme: ChatTheme = .light { didSet { applyTheme() } }
    var hasMore = false
    var hasNewer = false
    var topThreshold: CGFloat = 200
    var bottomThreshold: CGFloat = 200
    var isLoading = false { didSet { updateEmptyState() } }
    var isLoadingTop = false
    var isLoadingBottom = false
    var scrollToBottomThreshold: CGFloat = 150 { didSet { updateFABVisibility(animated: false) } }
    var showsSenderName = false

    var emojiReactionsList: [String] = [] {
        didSet { contextMenuEmojis = emojiReactionsList.map { ContextMenuEmoji(emoji: $0) } }
    }

    var collectionExtraInsetTop: CGFloat = 0 {
        didSet { guard isViewLoaded else { return }; view.setNeedsLayout() }
    }
    var collectionExtraInsetBottom: CGFloat = 0 {
        didSet { guard isViewLoaded else { return }; view.setNeedsLayout() }
    }

    // MARK: - Initial Scroll

    var isInitialScrollProtected = false
    var pendingScrollMessageId: String?

    // MARK: - Data

    private(set) var messages: [ChatMessage] = []
    var messageIndex: [String: ChatMessage] = [:]
    var listItems: [ListDiffable] = []

    // MARK: - IGListKit

    var collectionView: UICollectionView!
    var adapter: ListAdapter!

    // MARK: - UI Components

    var inputBar: ChatInputBar!
    private let emptyContainer = UIView()
    private let emptyLabel = UILabel()
    private let centerSpinner = UIActivityIndicatorView(style: .large)
    let fabButton = UIButton(type: .custom)
    var fabBlurView: UIVisualEffectView!
    let fabArrow = UIImageView()

    // MARK: - Floating Date

    private let floatingDatePill = UIView()
    private let floatingDateLabel = UILabel()
    private var floatingDateHideTask: DispatchWorkItem?
    private var currentFloatingDate: String?

    // MARK: - Context Menu

    var contextMenuEmojis: [ContextMenuEmoji] = []

    // MARK: - Audio

    let voiceRecorder = VoiceRecorder()

    // MARK: - Constraints

    var inputBarKeyboardConstraint: NSLayoutConstraint?

    // MARK: - Scroll State

    var fabVisible = false
    var isProgrammaticScroll = false
    var lastScrollEventTime: CFTimeInterval = 0
    let scrollThrottleInterval: CFTimeInterval = 1.0 / 30
    var visibleMessageIDs: Set<String> = []
    var pendingVisibleIDs: Set<String> = []
    var visibilityDebounceTask: DispatchWorkItem?
    let visibilityDebounceInterval: TimeInterval = 0.3
    var pendingHighlightId: String?
    var lastContentOffsetY: CGFloat = 0
    var isUserDragging = false
    var waitingForNewMessages = false
    var waitingForNewerMessages = false
    var lastKnownMessageCount = 0
    var pendingScrollToBottom = false
    var isLoadingNewerActive = false

    // MARK: - Scroll Compensation

    var scrollAnchorId: String?
    var scrollAnchorOffset: CGFloat = 0
    var needsScrollCompensation = false
    var savedOffsetForAppend: CGPoint?

    // MARK: - Keyboard Freeze (контекстное меню)

    var isInsetFrozen = false
    var frozenBottomInset: CGFloat?
    var keyboardWasVisible = false
    var kbHideObserver: Any?
    var kbShowObserver: Any?

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        setupCollectionView()
        setupAdapter()
        setupEmptyState()
        setupInputBar()
        setupFAB()
        setupFloatingDate()
        applyTheme()
        voiceRecorder.delegate = self
        VoicePlayer.shared.delegate = self
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        updateCollectionBottomInset()
    }

    // MARK: - Setup Collection View

    private func setupCollectionView() {
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .vertical
        layout.minimumLineSpacing = 0
        layout.minimumInteritemSpacing = 0

        collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.backgroundColor = .clear
        collectionView.keyboardDismissMode = .interactive
        collectionView.contentInsetAdjustmentBehavior = .never
        collectionView.alwaysBounceVertical = true
        collectionView.isPrefetchingEnabled = false
        collectionView.translatesAutoresizingMaskIntoConstraints = false
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

    // MARK: - Setup Adapter

    private func setupAdapter() {
        let updater = ListAdapterUpdater()
        updater.delegate = self
        adapter = ListAdapter(updater: updater, viewController: self)
        adapter.collectionView = collectionView
        adapter.dataSource = self
        adapter.scrollViewDelegate = self
    }

    // MARK: - Setup Empty State

    private func setupEmptyState() {
        emptyContainer.isHidden = true
        emptyContainer.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(emptyContainer)

        emptyLabel.text = NSLocalizedString("chat.empty", value: "No messages yet.\nBe the first!", comment: "")
        emptyLabel.font = .systemFont(ofSize: 16)
        emptyLabel.textAlignment = .center
        emptyLabel.numberOfLines = 0
        emptyLabel.translatesAutoresizingMaskIntoConstraints = false
        emptyContainer.addSubview(emptyLabel)

        centerSpinner.hidesWhenStopped = true
        centerSpinner.translatesAutoresizingMaskIntoConstraints = false
        emptyContainer.addSubview(centerSpinner)

        NSLayoutConstraint.activate([
            emptyContainer.topAnchor.constraint(equalTo: view.topAnchor),
            emptyContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            emptyContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            emptyContainer.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            emptyLabel.centerXAnchor.constraint(equalTo: emptyContainer.centerXAnchor),
            emptyLabel.centerYAnchor.constraint(equalTo: emptyContainer.centerYAnchor),
            emptyLabel.leadingAnchor.constraint(equalTo: emptyContainer.leadingAnchor, constant: 32),
            centerSpinner.centerXAnchor.constraint(equalTo: emptyContainer.centerXAnchor),
            centerSpinner.centerYAnchor.constraint(equalTo: emptyContainer.centerYAnchor),
        ])
    }

    // MARK: - Setup Input Bar

    private func setupInputBar() {
        inputBar = ChatInputBar()
        inputBar.delegate = self
        inputBar.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(inputBar)

        NSLayoutConstraint.activate([
            inputBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            inputBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            inputBar.heightAnchor.constraint(greaterThanOrEqualToConstant: ChatLayout.inputBarMinHeight),
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

    // MARK: - Setup FAB

    private func setupFAB() {
        let size = ChatLayout.fabSize
        fabButton.translatesAutoresizingMaskIntoConstraints = false
        fabButton.layer.cornerRadius = size / 2
        fabButton.layer.shadowColor = UIColor.black.cgColor
        fabButton.layer.shadowOpacity = 0.18
        fabButton.layer.shadowRadius = 8
        fabButton.layer.shadowOffset = CGSize(width: 0, height: 2)
        fabButton.alpha = 0
        fabButton.isUserInteractionEnabled = false
        fabButton.addTarget(self, action: #selector(fabTapped), for: .touchUpInside)
        view.addSubview(fabButton)

        let config = UIImage.SymbolConfiguration(pointSize: 18, weight: .semibold)
        fabArrow.image = UIImage(systemName: "chevron.down", withConfiguration: config)
        fabArrow.contentMode = .scaleAspectFit
        fabArrow.translatesAutoresizingMaskIntoConstraints = false
        fabArrow.isUserInteractionEnabled = false
        fabButton.addSubview(fabArrow)

        rebuildFABBlur()

        NSLayoutConstraint.activate([
            fabButton.widthAnchor.constraint(equalToConstant: size),
            fabButton.heightAnchor.constraint(equalToConstant: size),
            fabButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            fabButton.bottomAnchor.constraint(equalTo: inputBar.topAnchor, constant: -ChatLayout.fabMargin),
            fabArrow.centerXAnchor.constraint(equalTo: fabButton.centerXAnchor),
            fabArrow.centerYAnchor.constraint(equalTo: fabButton.centerYAnchor),
            fabArrow.widthAnchor.constraint(equalToConstant: 18),
            fabArrow.heightAnchor.constraint(equalToConstant: 18),
        ])
    }

    func rebuildFABBlur() {
        fabBlurView?.removeFromSuperview()
        fabBlurView = UIVisualEffectView(effect: UIBlurEffect(style: theme.fabBlurStyle))
        fabBlurView.translatesAutoresizingMaskIntoConstraints = false
        fabBlurView.isUserInteractionEnabled = false
        fabBlurView.layer.cornerRadius = ChatLayout.fabSize / 2
        fabBlurView.layer.masksToBounds = true
        fabButton.insertSubview(fabBlurView, at: 0)
        NSLayoutConstraint.activate([
            fabBlurView.topAnchor.constraint(equalTo: fabButton.topAnchor),
            fabBlurView.bottomAnchor.constraint(equalTo: fabButton.bottomAnchor),
            fabBlurView.leadingAnchor.constraint(equalTo: fabButton.leadingAnchor),
            fabBlurView.trailingAnchor.constraint(equalTo: fabButton.trailingAnchor),
        ])
    }

    // MARK: - Setup Floating Date

    private func setupFloatingDate() {
        floatingDatePill.translatesAutoresizingMaskIntoConstraints = false
        floatingDatePill.layer.cornerRadius = ChatLayout.dateSeparatorCornerRadius
        floatingDatePill.alpha = 0
        view.addSubview(floatingDatePill)

        floatingDateLabel.font = ChatLayout.dateSeparatorFont
        floatingDateLabel.textAlignment = .center
        floatingDateLabel.translatesAutoresizingMaskIntoConstraints = false
        floatingDatePill.addSubview(floatingDateLabel)

        NSLayoutConstraint.activate([
            floatingDatePill.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            floatingDatePill.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: ChatLayout.sectionSpacing),
            floatingDateLabel.topAnchor.constraint(equalTo: floatingDatePill.topAnchor, constant: ChatLayout.dateSeparatorVPad),
            floatingDateLabel.bottomAnchor.constraint(equalTo: floatingDatePill.bottomAnchor, constant: -ChatLayout.dateSeparatorVPad),
            floatingDateLabel.leadingAnchor.constraint(equalTo: floatingDatePill.leadingAnchor, constant: ChatLayout.dateSeparatorHPad),
            floatingDateLabel.trailingAnchor.constraint(equalTo: floatingDatePill.trailingAnchor, constant: -ChatLayout.dateSeparatorHPad),
        ])
    }

    func updateFloatingDate() {
        guard !messages.isEmpty else { hideFloatingDate(); return }

        let spacing = ChatLayout.sectionSpacing

        // Собираем все date-separator секции с краями в координатах view
        struct DateInfo {
            let groupDate: String
            let minY: CGFloat   // верх ячейки
            let maxY: CGFloat   // низ ячейки
        }
        var dateSections: [DateInfo] = []

        for (index, item) in listItems.enumerated() {
            guard let dateItem = item as? DateSeparatorListItem else { continue }
            guard let attrs = collectionView.layoutAttributesForItem(at: IndexPath(item: 0, section: index)) else { continue }
            let f = collectionView.convert(attrs.frame, to: view)
            dateSections.append(DateInfo(groupDate: dateItem.groupDate, minY: f.minY, maxY: f.maxY))
        }

        guard !dateSections.isEmpty else { return }

        // Позиция pill в координатах view
        let pillRestY = view.safeAreaLayoutGuide.layoutFrame.minY + spacing
        let pillH = floatingDatePill.bounds.height > 0
            ? floatingDatePill.bounds.height
            : ChatLayout.dateSeparatorFont.lineHeight + ChatLayout.dateSeparatorVPad * 2
        let pillBottom = pillRestY + pillH

        // Текущая дата — последняя, чей низ ушёл выше pill + spacing (полностью за экран + отступ)
        var currentDate: String?
        var nextInfo: DateInfo?

        for (i, info) in dateSections.enumerated() {
            if info.maxY < pillRestY - spacing {
                currentDate = info.groupDate
                nextInfo = (i + 1 < dateSections.count) ? dateSections[i + 1] : nil
            }
        }

        // Если ни одна дата ещё не прошла pill — берём первую видимую
        if currentDate == nil {
            currentDate = dateSections[0].groupDate
            nextInfo = dateSections.count > 1 ? dateSections[1] : nil
        }

        guard let groupDate = currentDate else { return }

        // Выталкивание: начинается когда верх следующей даты на расстоянии spacing от pill bottom
        if let next = nextInfo {
            let triggerY = pillBottom + spacing
            if next.minY < triggerY {
                let pushOffset = next.minY - triggerY  // от 0 до -(pillH + 2*spacing)
                floatingDatePill.transform = CGAffineTransform(translationX: 0, y: pushOffset)
            } else {
                floatingDatePill.transform = .identity
            }
        } else {
            floatingDatePill.transform = .identity
        }

        // Обновляем текст — после push-off fade in как при начале скрола
        let dateDidChange = groupDate != currentFloatingDate
        if dateDidChange {
            currentFloatingDate = groupDate
            floatingDateLabel.text = DateHelper.shared.sectionTitle(from: groupDate)
            floatingDatePill.transform = .identity
            floatingDatePill.alpha = 0  // showFloatingDate() сделает fade-in
        }

        showFloatingDate()
    }

    private func showFloatingDate() {
        floatingDateHideTask?.cancel()
        if floatingDatePill.alpha < 1 {
            UIView.animate(withDuration: 0.15) { self.floatingDatePill.alpha = 1 }
        }
        let task = DispatchWorkItem { [weak self] in
            UIView.animate(withDuration: 0.3) { self?.floatingDatePill.alpha = 0 }
        }
        floatingDateHideTask = task
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5, execute: task)
    }

    private func hideFloatingDate() {
        floatingDateHideTask?.cancel()
        UIView.animate(withDuration: 0.2) {
            self.floatingDatePill.alpha = 0
            self.floatingDatePill.transform = .identity
        }
    }

    // MARK: - Theme

    func applyTheme() {
        guard isViewLoaded else { return }
        collectionView.backgroundColor = theme.backgroundColor
        emptyLabel.textColor = theme.emptyStateText
        fabArrow.tintColor = theme.fabArrowColor
        rebuildFABBlur()
        inputBar.applyTheme(theme)
        floatingDatePill.backgroundColor = theme.dateSeparatorBackground
        floatingDateLabel.textColor = theme.dateSeparatorText
        adapter.performUpdates(animated: false)
    }

    // MARK: - Update Messages

    func updateMessages(_ newMessages: [ChatMessage]) {
        let wasAtBottom = isNearBottom()
        let wasEmpty = messages.isEmpty
        let oldFirstId = messages.first?.id
        let oldLastId = messages.last?.id
        let oldCount = messages.count

        messages = newMessages
        messageIndex = Dictionary(newMessages.map { ($0.id, $0) }, uniquingKeysWith: { _, new in new })
        rebuildListItems()

        let grew = newMessages.count > oldCount

        let isPrepend = !wasEmpty && grew
            && oldFirstId != nil && oldFirstId != newMessages.first?.id
            && oldLastId == newMessages.last?.id

        // Новые сообщения добавлены в конец (новое сообщение или подгрузка снизу)
        let isAppendAtBottom = !wasEmpty && grew
            && oldLastId != nil && oldLastId != newMessages.last?.id

        if isPrepend {
            let visibleTop = collectionView.contentOffset.y + collectionView.contentInset.top
            var anchorId = oldFirstId ?? ""
            var anchorOffset: CGFloat = 0

            let sorted = collectionView.indexPathsForVisibleItems
                .compactMap { collectionView.layoutAttributesForItem(at: $0) }
                .sorted { $0.frame.minY < $1.frame.minY }

            if let topAttr = sorted.first,
               let item = adapter.object(atSection: topAttr.indexPath.section) as? MessageListItem {
                anchorId = item.message.id
                anchorOffset = topAttr.frame.minY - visibleTop
            }

            let snapshot = collectionView.snapshotView(afterScreenUpdates: false)
            if let snapshot {
                snapshot.frame = collectionView.frame
                view.insertSubview(snapshot, aboveSubview: collectionView)
            }

            scrollAnchorId = anchorId
            scrollAnchorOffset = anchorOffset
            needsScrollCompensation = true

            adapter.performUpdates(animated: false) { [weak self] _ in
                guard let self else { return }
                snapshot?.removeFromSuperview()
                self.lastKnownMessageCount = newMessages.count
                self.updateEmptyState()
                self.updateFABVisibility(animated: false)
            }
            return
        }

        if isAppendAtBottom {
            let wantScroll = pendingScrollToBottom || (wasAtBottom && !isLoadingNewerActive)
            isLoadingNewerActive = false

            if wantScroll {
                pendingScrollToBottom = false
                adapter.performUpdates(animated: false) { [weak self] _ in
                    guard let self else { return }
                    self.scrollToBottom(animated: true)
                    self.lastKnownMessageCount = newMessages.count
                    self.updateEmptyState()
                    self.updateFABVisibility(animated: false)
                }
            } else {
                // Подгрузка снизу или пользователь прокрутил вверх — сохраняем позицию
                savedOffsetForAppend = collectionView.contentOffset
                adapter.performUpdates(animated: false) { [weak self] _ in
                    guard let self else { return }
                    self.lastKnownMessageCount = newMessages.count
                    self.updateEmptyState()
                    self.updateFABVisibility(animated: false)
                }
            }
            return
        }

        if wasEmpty && !newMessages.isEmpty {
            adapter.reloadData { [weak self] _ in
                guard let self else { return }
                if let scrollId = self.pendingScrollMessageId {
                    self.scrollToMessage(id: scrollId, position: "center", animated: false, highlight: false)
                    self.pendingScrollMessageId = nil
                } else {
                    self.scrollToBottom(animated: false)
                }
                self.isInitialScrollProtected = false
                self.lastKnownMessageCount = newMessages.count
                self.updateEmptyState()
                self.updateFABVisibility(animated: false)
            }
            return
        }

        // Обновление контента (редактирование, статус, замена и т.д.)
        let shouldScrollFallback = pendingScrollToBottom
        if shouldScrollFallback { pendingScrollToBottom = false }

        adapter.performUpdates(animated: !shouldScrollFallback) { [weak self] _ in
            guard let self else { return }
            if shouldScrollFallback {
                self.scrollToBottom(animated: true)
            }
            self.lastKnownMessageCount = newMessages.count
            self.updateEmptyState()
            self.updateFABVisibility(animated: !shouldScrollFallback)
        }
    }

    // MARK: - Build List Items

    private func rebuildListItems() {
        var items: [ListDiffable] = []

        if isLoadingTop {
            items.append(LoadingListItem(position: .top))
        }

        var currentGroup: String?
        for msg in messages {
            if msg.groupDate != currentGroup {
                currentGroup = msg.groupDate
                items.append(DateSeparatorListItem(groupDate: msg.groupDate))
            }
            items.append(MessageListItem(message: msg))
        }

        if isLoadingBottom {
            items.append(LoadingListItem(position: .bottom))
        }

        listItems = items
    }

    // MARK: - Scroll

    func scrollToBottom(animated: Bool) {
        guard !messages.isEmpty else { return }
        collectionView.layoutIfNeeded()
        isProgrammaticScroll = true
        let maxY = collectionView.contentSize.height - collectionView.bounds.height + collectionView.contentInset.bottom
        if maxY > -collectionView.contentInset.top {
            collectionView.setContentOffset(CGPoint(x: 0, y: maxY), animated: animated)
        }
        if !animated { isProgrammaticScroll = false }
    }

    func scrollToMessage(id: String, position: String, animated: Bool, highlight: Bool) {
        guard let sectionIndex = listItems.firstIndex(where: {
            ($0 as? MessageListItem)?.message.id == id
        }) else { return }
        let totalSections = collectionView.numberOfSections
        guard sectionIndex < totalSections else { return }

        isProgrammaticScroll = true
        collectionView.layoutIfNeeded()

        let scrollPos: UICollectionView.ScrollPosition
        switch position {
        case "top": scrollPos = .top
        case "bottom": scrollPos = .bottom
        default: scrollPos = .centeredVertically
        }

        collectionView.scrollToItem(at: IndexPath(item: 0, section: sectionIndex),
                                     at: scrollPos, animated: animated)

        if !animated { isProgrammaticScroll = false }

        if highlight {
            pendingHighlightId = id
            DispatchQueue.main.asyncAfter(deadline: .now() + (animated ? 0.35 : 0.1)) { [weak self] in
                self?.performHighlight()
            }
        }
    }

    func performHighlight() {
        guard let id = pendingHighlightId else { return }
        pendingHighlightId = nil
        guard let sectionIndex = listItems.firstIndex(where: {
            ($0 as? MessageListItem)?.message.id == id
        }) else { return }
        let sc = adapter.sectionController(forSection: sectionIndex) as? MessageSectionController
        sc?.highlightCell()
    }

    // MARK: - Input Mode

    func beginReply(info: ReplyInfo) { inputBar.beginReply(info: info, theme: theme) }
    func beginEdit(messageId: String, text: String) { inputBar.beginEdit(messageId: messageId, text: text, theme: theme) }
    func clearInputMode() { inputBar.cancelMode() }

    // MARK: - Helpers

    func message(forID id: String) -> ChatMessage? { messageIndex[id] }

    func distanceFromBottom() -> CGFloat {
        guard let cv = collectionView else { return 0 }
        return max(0, cv.contentSize.height - cv.contentOffset.y - cv.bounds.height + cv.contentInset.bottom)
    }

    func isNearBottom() -> Bool {
        guard collectionView.contentSize.height > 0 else { return true }
        return distanceFromBottom() <= scrollToBottomThreshold
    }

    func updateFABVisibility(animated: Bool) {
        let shouldShow = !isNearBottom() && !messages.isEmpty
        guard shouldShow != fabVisible else { return }
        fabVisible = shouldShow
        let alpha: CGFloat = shouldShow ? 1 : 0
        fabButton.isUserInteractionEnabled = shouldShow
        if animated {
            UIView.animate(withDuration: 0.25) { self.fabButton.alpha = alpha }
        } else {
            fabButton.alpha = alpha
        }
    }

    func updateEmptyState() {
        let isEmpty = messages.isEmpty
        emptyContainer.isHidden = !isEmpty
        if isEmpty && isLoading {
            emptyLabel.isHidden = true
            centerSpinner.startAnimating()
        } else {
            centerSpinner.stopAnimating()
            emptyLabel.isHidden = false
        }
    }

    func updateCollectionBottomInset() {
        guard !isInsetFrozen else { return }
        guard let cv = collectionView else { return }
        guard inputBar != nil, inputBar.frame.height > 0, view.bounds.height > 0 else { return }

        let inputBarZone = view.bounds.height - inputBar.frame.minY
        let newBottom = inputBarZone + ChatLayout.collectionBottomPadding + collectionExtraInsetBottom
        let newIndicatorBottom = inputBarZone - view.safeAreaInsets.bottom
        let oldBottom = cv.contentInset.bottom
        guard abs(oldBottom - newBottom) > 0.5 else { return }

        if isUserDragging {
            cv.contentInset.bottom = newBottom
            cv.verticalScrollIndicatorInsets.bottom = newIndicatorBottom
            return
        }

        let distanceFromEnd = cv.contentSize.height - cv.contentOffset.y - cv.bounds.height + oldBottom
        cv.contentInset.bottom = newBottom
        cv.verticalScrollIndicatorInsets.bottom = newIndicatorBottom
        let newOffsetY = cv.contentSize.height - cv.bounds.height + newBottom - distanceFromEnd
        cv.contentOffset = CGPoint(x: 0, y: max(-cv.contentInset.top, newOffsetY))
    }

    @objc func dismissKeyboard() { view.endEditing(true) }
    @objc func fabTapped() { scrollToBottom(animated: true) }
}

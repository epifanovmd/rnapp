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
    var isLoadingBottom = false
    var scrollToBottomThreshold: CGFloat = 150 { didSet { updateFABVisibility(animated: false) } }

    var emojiReactionsList: [String] = [] {
        didSet { contextMenuEmojis = emojiReactionsList.map { ContextMenuEmoji(emoji: $0) } }
    }

    var collectionExtraInsetTop: CGFloat = 0 {
        didSet { guard isViewLoaded else { return }; updateCollectionInsets() }
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
    private var listItems: [ListDiffable] = []

    // MARK: - IGListKit

    private var collectionView: UICollectionView!
    private var adapter: ListAdapter!

    // MARK: - UI Components

    var inputBar: ChatInputBar!
    private let emptyContainer = UIView()
    private let emptyLabel = UILabel()
    private let centerSpinner = UIActivityIndicatorView(style: .large)
    private let fabButton = UIButton(type: .custom)
    private var fabBlurView: UIVisualEffectView!
    private let fabArrow = UIImageView()

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

    private var inputBarKeyboardConstraint: NSLayoutConstraint?

    // MARK: - Scroll State

    private var fabVisible = false
    private var isProgrammaticScroll = false
    private var lastScrollEventTime: CFTimeInterval = 0
    private let scrollThrottleInterval: CFTimeInterval = 1.0 / 30
    private var visibleMessageIDs: Set<String> = []
    private var pendingVisibleIDs: Set<String> = []
    private var visibilityDebounceTask: DispatchWorkItem?
    private let visibilityDebounceInterval: TimeInterval = 0.3
    private var pendingHighlightId: String?
    private var lastContentOffsetY: CGFloat = 0
    private var isUserDragging = false
    private var waitingForNewMessages = false
    private var waitingForNewerMessages = false
    private var lastKnownMessageCount = 0
    private var pendingScrollToBottom = false

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

    private func rebuildFABBlur() {
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
            floatingDatePill.topAnchor.constraint(equalTo: collectionView.topAnchor, constant: ChatLayout.collectionTopPadding + collectionExtraInsetTop + 8),
            floatingDateLabel.topAnchor.constraint(equalTo: floatingDatePill.topAnchor, constant: ChatLayout.dateSeparatorVPad),
            floatingDateLabel.bottomAnchor.constraint(equalTo: floatingDatePill.bottomAnchor, constant: -ChatLayout.dateSeparatorVPad),
            floatingDateLabel.leadingAnchor.constraint(equalTo: floatingDatePill.leadingAnchor, constant: ChatLayout.dateSeparatorHPad),
            floatingDateLabel.trailingAnchor.constraint(equalTo: floatingDatePill.trailingAnchor, constant: -ChatLayout.dateSeparatorHPad),
        ])
    }

    private func updateFloatingDate() {
        guard !messages.isEmpty else {
            hideFloatingDate()
            return
        }

        // Найти самый верхний видимый элемент и определить его groupDate
        var topGroupDate: String?
        let visibleRect = CGRect(origin: collectionView.contentOffset, size: collectionView.bounds.size)

        for (index, item) in listItems.enumerated() {
            guard let attrs = collectionView.layoutAttributesForItem(at: IndexPath(item: 0, section: index)) else { continue }
            if attrs.frame.intersects(visibleRect) {
                if let msgItem = item as? MessageListItem {
                    topGroupDate = msgItem.message.groupDate
                    break
                } else if let dateItem = item as? DateSeparatorListItem {
                    topGroupDate = dateItem.groupDate
                    break
                }
            }
        }

        guard let groupDate = topGroupDate else { return }

        if groupDate != currentFloatingDate {
            currentFloatingDate = groupDate
            let title = DateHelper.shared.sectionTitle(from: groupDate)
            floatingDateLabel.text = title
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
        UIView.animate(withDuration: 0.2) { self.floatingDatePill.alpha = 0 }
    }

    // MARK: - Theme

    private func applyTheme() {
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

        // ── Классификация ──

        let grew = newMessages.count > oldCount

        let isPrepend = !wasEmpty && grew
            && oldFirstId != nil && oldFirstId != newMessages.first?.id
            && oldLastId == newMessages.last?.id

        let isAppendFromLoad = !wasEmpty && grew
            && oldLastId != nil && oldLastId != newMessages.last?.id
            && oldFirstId == newMessages.first?.id

        let isNewMessage = !wasEmpty && grew
            && oldLastId != nil && oldLastId != newMessages.last?.id
            && !isAppendFromLoad

        // ── Prepend: подгрузка сверху ──
        // Запоминаем anchor (верхний видимый элемент), обновляем через
        // performUpdates(animated: false) внутри CATransaction без
        // анимаций, компенсируем offset в completion до
        // отрисовки кадра.

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

            CATransaction.begin()
            CATransaction.setDisableActions(true)

            adapter.performUpdates(animated: false) { [weak self] _ in
                guard let self else { return }

                // Ищем anchor в обновлённом layout
                if let sectionIndex = self.listItems.firstIndex(where: {
                    ($0 as? MessageListItem)?.message.id == anchorId
                }) {
                    let ip = IndexPath(item: 0, section: sectionIndex)
                    self.collectionView.layoutIfNeeded()
                    if let attrs = self.collectionView.layoutAttributesForItem(at: ip) {
                        let target = attrs.frame.minY - self.collectionView.contentInset.top - anchorOffset
                        self.collectionView.contentOffset = CGPoint(
                            x: 0,
                            y: max(-self.collectionView.contentInset.top, target)
                        )
                    }
                }

                self.lastKnownMessageCount = newMessages.count
                self.updateEmptyState()
                self.updateFABVisibility(animated: false)
            }

            CATransaction.commit()
            return
        }

        // ── AppendFromLoad: подгрузка снизу ──
        // Offset не меняем — новые элементы ниже viewport.

        if isAppendFromLoad {
            let savedOffset = collectionView.contentOffset

            CATransaction.begin()
            CATransaction.setDisableActions(true)

            adapter.performUpdates(animated: false) { [weak self] _ in
                guard let self else { return }
                self.collectionView.contentOffset = savedOffset
                self.lastKnownMessageCount = newMessages.count
                self.updateEmptyState()
                self.updateFABVisibility(animated: false)
            }

            CATransaction.commit()
            return
        }

        // ── Остальное: initial, новое сообщение, обновление ──

        adapter.performUpdates(animated: !wasEmpty) { [weak self] _ in
            guard let self else { return }

            if wasEmpty && !newMessages.isEmpty {
                if let scrollId = self.pendingScrollMessageId {
                    self.scrollToMessage(id: scrollId, position: "center", animated: false, highlight: false)
                    self.pendingScrollMessageId = nil
                } else {
                    self.scrollToBottom(animated: false)
                }
                self.isInitialScrollProtected = false
            } else if isNewMessage || self.pendingScrollToBottom {
                if wasAtBottom || self.pendingScrollToBottom {
                    self.pendingScrollToBottom = false
                    self.scrollToBottom(animated: true)
                }
            }

            self.lastKnownMessageCount = newMessages.count
            self.updateEmptyState()
            self.updateFABVisibility(animated: true)
        }
    }

    // MARK: - Build List Items

    private func rebuildListItems() {
        var items: [ListDiffable] = []

        if hasMore && isLoading {
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

        if hasNewer && isLoadingBottom {
            items.append(LoadingListItem(position: .bottom))
        }

        listItems = items
    }

    // MARK: - Scroll

    func scrollToBottom(animated: Bool) {
        guard !messages.isEmpty else { return }
        if collectionView.contentSize.height <= 0 { collectionView.layoutIfNeeded() }
        isProgrammaticScroll = true

        let maxY = collectionView.contentSize.height - collectionView.bounds.height + collectionView.contentInset.bottom
        if maxY > -collectionView.contentInset.top {
            collectionView.setContentOffset(CGPoint(x: 0, y: maxY), animated: animated)
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
            self?.isProgrammaticScroll = false
        }
    }

    func scrollToMessage(id: String, position: String, animated: Bool, highlight: Bool) {
        guard let sectionIndex = listItems.firstIndex(where: {
            ($0 as? MessageListItem)?.message.id == id
        }) else { return }

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

        if highlight {
            pendingHighlightId = id
            DispatchQueue.main.asyncAfter(deadline: .now() + (animated ? 0.35 : 0.1)) { [weak self] in
                self?.performHighlight()
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            self?.isProgrammaticScroll = false
        }
    }

    private func performHighlight() {
        guard let id = pendingHighlightId else { return }
        pendingHighlightId = nil
        guard let sectionIndex = listItems.firstIndex(where: {
            ($0 as? MessageListItem)?.message.id == id
        }) else { return }
        let sc = adapter.sectionController(forSection: sectionIndex) as? MessageSectionController
        sc?.highlightCell()
    }

    // MARK: - Input Mode

    func beginReply(info: ReplyInfo) {
        inputBar.beginReply(info: info, theme: theme)
    }

    func beginEdit(messageId: String, text: String) {
        inputBar.beginEdit(messageId: messageId, text: text, theme: theme)
    }

    func clearInputMode() {
        inputBar.cancelMode()
    }

    // MARK: - Helpers

    func message(forID id: String) -> ChatMessage? { messageIndex[id] }

    private func distanceFromBottom() -> CGFloat {
        guard let cv = collectionView else { return 0 }
        return max(0, cv.contentSize.height - cv.contentOffset.y - cv.bounds.height + cv.contentInset.bottom)
    }

    private func isNearBottom() -> Bool {
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

    private func updateEmptyState() {
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

    private func updateCollectionInsets() {
        collectionView.contentInset.top = ChatLayout.collectionTopPadding + collectionExtraInsetTop
    }

    /// Синхронизирует contentInset.bottom с текущей позицией inputBar.
    /// Вызывается каждый кадр анимации клавиатуры через viewDidLayoutSubviews.
    /// Сохраняет distanceFromEnd — контент плавно поднимается/опускается вместе с клавиатурой.
    private func updateCollectionBottomInset() {
        guard let cv = collectionView else { return }
        guard inputBar.frame.height > 0, view.bounds.height > 0 else { return }

        let inputBarZone = view.bounds.height - inputBar.frame.minY
        let newBottom = inputBarZone + ChatLayout.collectionBottomPadding + collectionExtraInsetBottom
        let newIndicatorBottom = inputBarZone

        let oldBottom = cv.contentInset.bottom
        guard abs(oldBottom - newBottom) > 0.5 else { return }

        // При интерактивном dismiss UIKit сам ведёт offset — только inset
        if isUserDragging {
            cv.contentInset.bottom = newBottom
            cv.verticalScrollIndicatorInsets.bottom = newIndicatorBottom
            return
        }

        // Сохраняем расстояние от текущей позиции до конца контента
        let distanceFromEnd = cv.contentSize.height - cv.contentOffset.y - cv.bounds.height + oldBottom

        cv.contentInset.bottom = newBottom
        cv.verticalScrollIndicatorInsets.bottom = newIndicatorBottom

        // Восстанавливаем то же расстояние до конца
        let newOffsetY = cv.contentSize.height - cv.bounds.height + newBottom - distanceFromEnd
        cv.contentOffset = CGPoint(x: 0, y: max(-cv.contentInset.top, newOffsetY))
    }

    @objc private func dismissKeyboard() { view.endEditing(true) }
    @objc private func fabTapped() { scrollToBottom(animated: true) }

    // MARK: - Visibility Tracking

    private func updateVisibleMessages() {
        guard !messages.isEmpty else { return }
        var ids: Set<String> = []
        for cell in collectionView.visibleCells {
            guard let indexPath = collectionView.indexPath(for: cell),
                  indexPath.section < listItems.count,
                  let msgItem = listItems[indexPath.section] as? MessageListItem else { continue }
            ids.insert(msgItem.message.id)
        }

        let newIDs = ids.subtracting(visibleMessageIDs)
        guard !newIDs.isEmpty else { return }
        visibleMessageIDs = ids

        pendingVisibleIDs.formUnion(newIDs)
        visibilityDebounceTask?.cancel()
        let task = DispatchWorkItem { [weak self] in
            guard let self, !self.pendingVisibleIDs.isEmpty else { return }
            let batch = Array(self.pendingVisibleIDs)
            self.pendingVisibleIDs.removeAll()
            self.delegate?.chatMessagesDidAppear(ids: batch)
        }
        visibilityDebounceTask = task
        DispatchQueue.main.asyncAfter(deadline: .now() + visibilityDebounceInterval, execute: task)
    }
}

// MARK: - ListAdapterDataSource

extension ChatViewController: ListAdapterDataSource {
    func objects(for listAdapter: ListAdapter) -> [ListDiffable] {
        listItems
    }

    func listAdapter(_ listAdapter: ListAdapter, sectionControllerFor object: Any) -> ListSectionController {
        if object is MessageListItem {
            let sc = MessageSectionController()
            sc.sectionDelegate = self
            return sc
        }
        if object is DateSeparatorListItem {
            let sc = DateSeparatorSectionController()
            sc.themeProvider = self
            return sc
        }
        if object is LoadingListItem {
            return LoadingSectionController()
        }
        fatalError("Unknown list item type")
    }

    func emptyView(for listAdapter: ListAdapter) -> UIView? { nil }
}

// MARK: - MessageSectionDelegate

extension ChatViewController: MessageSectionDelegate {
    var currentTheme: ChatTheme { theme }

    func resolveReply(for info: ReplyInfo) -> ReplyDisplayInfo? {
        guard let original = messageIndex[info.replyToId] else { return nil }
        return ReplyDisplayInfo(
            senderName: original.senderName ?? "Unknown",
            text: original.content.text ?? "",
            hasImage: original.content.images != nil
        )
    }

    func messageSectionDidTap(messageId: String) {
        delegate?.chatDidTapMessage(id: messageId)
    }

    func messageSectionDidLongPress(messageId: String, cell: UICollectionViewCell) {
        guard let msg = messageIndex[messageId] else { return }
        showContextMenu(for: msg, from: cell)
    }

    func messageSectionDidTapReply(messageId: String) {
        // Scroll to the original message and highlight it
        scrollToMessage(id: messageId, position: "center", animated: true, highlight: true)
        delegate?.chatDidTapReplyMessage(id: messageId)
    }

    func messageSectionDidTapVideo(messageId: String, url: String) {
        delegate?.chatDidTapVideo(messageId: messageId, url: url)
    }

    func messageSectionDidTapFile(messageId: String, url: String, name: String) {
        delegate?.chatDidTapFile(messageId: messageId, url: url, name: name)
    }

    func messageSectionDidTapPollOption(messageId: String, pollId: String, optionId: String) {
        delegate?.chatDidTapPollOption(messageId: messageId, pollId: pollId, optionId: optionId)
    }

    func messageSectionDidTapPollDetail(messageId: String, pollId: String) {
        delegate?.chatDidTapPollDetail(messageId: messageId, pollId: pollId)
    }

    func messageSectionDidTapVoice(messageId: String, url: String) {
        VoicePlayer.shared.toggle(url: url)
    }

    // MARK: - Context Menu

    private func showContextMenu(for msg: ChatMessage, from cell: UICollectionViewCell) {
        let config = ContextMenuConfiguration(
            id: msg.id,
            sourceView: cell,
            emojis: contextMenuEmojis,
            actions: msg.actions.map {
                ContextMenuAction(id: $0.id, title: $0.title,
                                  systemImage: $0.systemImage, isDestructive: $0.isDestructive)
            },
            snapshotCornerRadius: ChatLayout.bubbleCornerRadius
        )

        let menuTheme: ContextMenuTheme = theme.isDark ? .dark : .light

        ContextMenuViewController.present(
            configuration: config,
            theme: menuTheme,
            from: self,
            delegate: self
        )
    }
}

// MARK: - ContextMenuDelegate

extension ChatViewController: ContextMenuDelegate {
    func contextMenu(_ menu: ContextMenuViewController, didSelectEmoji emoji: String, forId id: String) {
        menu.dismissMenu()
        delegate?.chatDidSelectEmojiReaction(emoji: emoji, messageId: id)
    }

    func contextMenu(_ menu: ContextMenuViewController, didSelectAction action: ContextMenuAction, forId id: String) {
        menu.dismissMenu()
        delegate?.chatDidSelectAction(actionId: action.id, messageId: id)
    }

    func contextMenuDidDismiss(_ menu: ContextMenuViewController, id: String) {
        // No-op
    }
}

// MARK: - UIScrollViewDelegate

extension ChatViewController: UIScrollViewDelegate {
    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        let now = CACurrentMediaTime()
        if now - lastScrollEventTime >= scrollThrottleInterval {
            lastScrollEventTime = now
            delegate?.chatDidScroll(offset: scrollView.contentOffset)
        }

        let offset = scrollView.contentOffset.y
        let contentH = scrollView.contentSize.height
        let frameH = scrollView.bounds.height

        // Reach top
        if offset < topThreshold && hasMore && !isLoading && !waitingForNewMessages {
            waitingForNewMessages = true
            delegate?.chatDidReachTop(distance: offset)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                self?.waitingForNewMessages = false
            }
        }

        // Reach bottom
        if contentH - offset - frameH < bottomThreshold && hasNewer && !isLoadingBottom && !waitingForNewerMessages {
            waitingForNewerMessages = true
            delegate?.chatDidReachBottom(distance: contentH - offset - frameH)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                self?.waitingForNewerMessages = false
            }
        }

        lastContentOffsetY = offset
        updateFABVisibility(animated: true)
        updateVisibleMessages()
        updateFloatingDate()
    }

    func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
        isUserDragging = true
    }

    func scrollViewDidEndDragging(_ scrollView: UIScrollView, willDecelerate decelerate: Bool) {
        isUserDragging = false
    }
}

// MARK: - ChatInputBarDelegate

extension ChatViewController: ChatInputBarDelegate {
    func inputBarDidSend(text: String, replyToId: String?) {
        pendingScrollToBottom = true
        delegate?.chatDidSendMessage(text: text, replyToId: replyToId)
    }

    func inputBarDidEdit(text: String, messageId: String) {
        delegate?.chatDidEditMessage(text: text, messageId: messageId)
    }

    func inputBarDidCancelMode(type: String) {
        delegate?.chatDidCancelInputAction(type: type)
    }

    func inputBarDidTapAttachment() {
        delegate?.chatDidTapAttachment()
    }

    func inputBarDidStartRecording() {
        voiceRecorder.startRecording()
    }

    func inputBarDidStopRecording() {
        voiceRecorder.stopRecording()
    }

    func inputBarDidCancelRecording() {
        voiceRecorder.cancelRecording()
    }

    func inputBarDidChangeText(_ text: String) {
        delegate?.chatDidChangeInputText(text)
    }
}

// MARK: - VoiceRecorderDelegate

extension ChatViewController: VoiceRecorderDelegate {
    func voiceRecorderDidStart() {
        inputBar.showRecordingUI(duration: 0)
    }

    func voiceRecorderDidStop(fileURL: URL, duration: TimeInterval) {
        inputBar.hideRecordingUI()
        delegate?.chatDidCompleteVoiceRecording(fileURL: fileURL, duration: duration)
    }

    func voiceRecorderDidCancel() {
        inputBar.hideRecordingUI()
    }

    func voiceRecorderDidFail(error: Error) {
        inputBar.hideRecordingUI()
    }

    func voiceRecorderDidUpdateDuration(_ duration: TimeInterval) {
        inputBar.showRecordingUI(duration: duration)
    }

    func voiceRecorderDidUpdateLevel(_ level: Float) {
        // Could be used for visual feedback
    }
}

// MARK: - VoicePlayerDelegate

extension ChatViewController: VoicePlayerDelegate {
    func voicePlayerDidChangeState(_ state: VoicePlayerState) {
        // Visible voice cells update via their own delegate subscription
    }
}

// MARK: - KeyboardListenerDelegate (iOS < 15)

extension ChatViewController: KeyboardListenerDelegate {
    func keyboardWillChangeFrame(info: KeyboardInfo) {
        guard #unavailable(iOS 15) else { return }
        guard let window = view.window else { return }

        let kbInView = view.convert(info.frameEnd, from: window.screen.coordinateSpace)
        let kbHeight = max(0, view.bounds.height - kbInView.origin.y)
        let safeBottom = view.safeAreaInsets.bottom
        let newConst = -(max(kbHeight, safeBottom) - safeBottom)

        guard inputBarKeyboardConstraint?.constant != newConst else { return }
        inputBarKeyboardConstraint?.constant = newConst

        let curve = UIView.AnimationOptions(rawValue: UInt(info.animationCurve.rawValue) << 16)
        if info.animationDuration > 0 {
            UIView.animate(withDuration: info.animationDuration, delay: 0,
                           options: [curve, .beginFromCurrentState]) {
                self.view.layoutIfNeeded()
            }
        } else {
            view.layoutIfNeeded()
        }
    }
}

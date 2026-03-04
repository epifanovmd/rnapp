// MARK: - ChatViewController.swift

import UIKit

// MARK: - Delegate Protocol

protocol ChatViewControllerDelegate: AnyObject {
    func chatViewController(_ controller: ChatViewController, didScrollToOffset offset: CGPoint)
    func chatViewController(_ controller: ChatViewController, didReachTopThreshold threshold: CGFloat)
    func chatViewController(_ controller: ChatViewController, messagesDidAppear messageIDs: [String])
    func chatViewController(_ controller: ChatViewController, didTapMessage message: ChatMessage)
    func chatViewController(_ controller: ChatViewController, didSelectAction action: MessageAction, for message: ChatMessage)
    func chatViewController(_ controller: ChatViewController, didSendMessage text: String, replyToId: String?)
    func chatViewController(_ controller: ChatViewController, didTapReply replyId: String)
    func chatViewControllerDidTapAttachment(_ controller: ChatViewController)
}

// MARK: - Scroll Position

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

    // MARK: Public

    weak var delegate: ChatViewControllerDelegate?
    var actions: [MessageAction] = []
    var topThreshold: CGFloat = 200

    var isLoading: Bool = false { didSet { updateLoadingState() } }

    /// Distance from bottom (pts) at which the scroll-to-bottom FAB appears.
    var scrollToBottomThreshold: CGFloat = 150 { didSet { updateFABVisibility(animated: false) } }

    // MARK: Data

    private var sections: [MessageSection] = []
    private var collectionView: UICollectionView!
    private var dataSource: UICollectionViewDiffableDataSource<String, String>!
    private var inputBar: InputBarView!

    // MARK: Empty state

    private let emptyStateContainer: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.isHidden = true
        return v
    }()

    private let emptyStateLabel: UILabel = {
        let l = UILabel()
        l.text = "No messages yet.\nBe the first to say something! 👋"
        l.font = .systemFont(ofSize: 16)
        l.textColor = .secondaryLabel
        l.textAlignment = .center
        l.numberOfLines = 0
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let centerSpinner: UIActivityIndicatorView = {
        let s = UIActivityIndicatorView(style: .large)
        s.translatesAutoresizingMaskIntoConstraints = false
        s.hidesWhenStopped = true
        return s
    }()

    // MARK: Scroll-to-bottom FAB
    // Matches Telegram's circular arrow button.

    private let fabButton: UIButton = {
        let btn = UIButton(type: .custom)
        btn.translatesAutoresizingMaskIntoConstraints = false

        // Circle background with blur
        btn.backgroundColor = .clear
        btn.alpha = 0
        btn.isUserInteractionEnabled = false   // enabled when visible

        // Shadow
        btn.layer.shadowColor  = UIColor.black.cgColor
        btn.layer.shadowOpacity = 0.18
        btn.layer.shadowRadius  = 8
        btn.layer.shadowOffset  = CGSize(width: 0, height: 2)

        return btn
    }()

    /// Blur inside the FAB circle
    private let fabBlurView: UIVisualEffectView = {
        let v = UIVisualEffectView(effect: UIBlurEffect(style: .systemThickMaterial))
        v.translatesAutoresizingMaskIntoConstraints = false
        v.isUserInteractionEnabled = false
        return v
    }()

    private let fabArrow: UIImageView = {
        let cfg = UIImage.SymbolConfiguration(pointSize: 18, weight: .semibold)
        let iv = UIImageView(image: UIImage(systemName: "chevron.down", withConfiguration: cfg))
        iv.translatesAutoresizingMaskIntoConstraints = false
        iv.tintColor = .label
        iv.contentMode = .scaleAspectFit
        iv.isUserInteractionEnabled = false
        return iv
    }()

    private var fabVisible = false

    // MARK: Layout

    private var inputBarBottomConstraint: NSLayoutConstraint!
    private var collectionViewBottomConstraint: NSLayoutConstraint!
    private var emptyStateContainerBottomConstraint: NSLayoutConstraint!

    // MARK: Keyboard

    private var keyboardHeight: CGFloat = 0

    // MARK: Load-more

    private var waitingForNewMessages = false
    private var lastKnownMessageCount = 0

    // MARK: Scroll tracking

    private var lastContentOffsetY: CGFloat = 0
    private var isProgrammaticScroll = false
    private var visibleMessageIDs: Set<String> = []

    // MARK: Reply

    private var replyMessage: ChatMessage? { didSet { inputBar?.setReplyMessage(replyMessage) } }

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
    }

    deinit { NotificationCenter.default.removeObserver(self) }

    // MARK: - Collection View

    private func setupCollectionView() {
        collectionView = UICollectionView(frame: .zero, collectionViewLayout: makeLayout())
        collectionView.backgroundColor = .clear
        collectionView.keyboardDismissMode = .interactive
        collectionView.contentInset = UIEdgeInsets(top: 8, left: 0, bottom: 8, right: 0)
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        collectionView.register(MessageCell.self, forCellWithReuseIdentifier: MessageCell.reuseID)
        collectionView.register(
            DateSeparatorView1.self,
            forSupplementaryViewOfKind: UICollectionView.elementKindSectionHeader,
            withReuseIdentifier: DateSeparatorView1.reuseID
        )
        collectionView.delegate = self
        view.addSubview(collectionView)

        collectionViewBottomConstraint = collectionView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
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

    // MARK: - Empty State

    private func setupEmptyState() {
        view.addSubview(emptyStateContainer)
        emptyStateContainer.addSubview(emptyStateLabel)
        emptyStateContainer.addSubview(centerSpinner)

        emptyStateContainerBottomConstraint = emptyStateContainer.bottomAnchor.constraint(equalTo: view.bottomAnchor)

        NSLayoutConstraint.activate([
            emptyStateContainer.topAnchor.constraint(equalTo: view.topAnchor),
            emptyStateContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            emptyStateContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            emptyStateContainerBottomConstraint,

            emptyStateLabel.centerXAnchor.constraint(equalTo: emptyStateContainer.centerXAnchor),
            emptyStateLabel.centerYAnchor.constraint(equalTo: emptyStateContainer.centerYAnchor),
            emptyStateLabel.leadingAnchor.constraint(equalTo: emptyStateContainer.leadingAnchor, constant: 32),
            emptyStateLabel.trailingAnchor.constraint(equalTo: emptyStateContainer.trailingAnchor, constant: -32),

            centerSpinner.centerXAnchor.constraint(equalTo: emptyStateContainer.centerXAnchor),
            centerSpinner.centerYAnchor.constraint(equalTo: emptyStateContainer.centerYAnchor),
        ])
    }

    // MARK: - Input Bar

    private func setupInputBar() {
        inputBar = InputBarView()
        inputBar.delegate = self
        inputBar.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(inputBar)

        // Initial constant will be updated in viewDidLayoutSubviews once safe area is known.
        inputBarBottomConstraint = inputBar.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        NSLayoutConstraint.activate([
            inputBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            inputBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            inputBar.heightAnchor.constraint(greaterThanOrEqualToConstant: 52),
            inputBarBottomConstraint,
        ])

        collectionViewBottomConstraint.isActive = false
        collectionViewBottomConstraint = collectionView.bottomAnchor.constraint(equalTo: inputBar.topAnchor)
        collectionViewBottomConstraint.isActive = true

        emptyStateContainerBottomConstraint.isActive = false
        emptyStateContainerBottomConstraint = emptyStateContainer.bottomAnchor.constraint(equalTo: inputBar.topAnchor)
        emptyStateContainerBottomConstraint.isActive = true
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // Keep input bar above safe area when keyboard is hidden.
        // Once keyboard is shown, keyboardWillChangeFrame takes over.
        if keyboardHeight == 0 {
            let safeBottom = view.safeAreaInsets.bottom
            let desired = -safeBottom
            if inputBarBottomConstraint.constant != desired {
                inputBarBottomConstraint.constant = desired
            }
        }
    }

    @objc private func dismissKeyboard() { view.endEditing(true) }

    // MARK: - Scroll-to-bottom FAB

    private func setupFAB() {
        // Layer the blur + arrow inside the button
        fabButton.addSubview(fabBlurView)
        fabButton.addSubview(fabArrow)

        view.addSubview(fabButton)

        let size: CGFloat = 40

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

        // Round corners — needs to happen after layout; use layer directly
        fabButton.layer.cornerRadius  = size / 2
        fabButton.layer.masksToBounds = false   // keep shadow visible
        fabBlurView.layer.cornerRadius = size / 2
        fabBlurView.layer.masksToBounds = true

        fabButton.addTarget(self, action: #selector(fabTapped), for: .touchUpInside)
    }

    @objc private func fabTapped() {
        scrollToBottom(animated: true)
    }

    // MARK: FAB show/hide

    private func updateFABVisibility(animated: Bool) {
        let shouldShow = distanceFromBottom() > scrollToBottomThreshold

        guard shouldShow != fabVisible else { return }
        fabVisible = shouldShow

        let targetAlpha: CGFloat = shouldShow ? 1 : 0
        let targetScale: CGFloat = shouldShow ? 1 : 0.7

        fabButton.isUserInteractionEnabled = shouldShow

        if animated {
            UIView.animate(
                withDuration: 0.22,
                delay: 0,
                usingSpringWithDamping: 0.7,
                initialSpringVelocity: 0.3,
                options: [.allowUserInteraction]
            ) {
                self.fabButton.alpha = targetAlpha
                self.fabButton.transform = CGAffineTransform(scaleX: targetScale, y: targetScale)
            }
        } else {
            fabButton.alpha     = targetAlpha
            fabButton.transform = CGAffineTransform(scaleX: targetScale, y: targetScale)
        }
    }

    private func distanceFromBottom() -> CGFloat {
        let contentH = collectionView.contentSize.height
        let offsetY  = collectionView.contentOffset.y
        let visibleH = collectionView.bounds.height
        return max(0, contentH - offsetY - visibleH)
    }

    // MARK: - Keyboard

    private func setupKeyboardObservers() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(keyboardWillChangeFrame(_:)),
            name: UIResponder.keyboardWillChangeFrameNotification,
            object: nil
        )
    }

    @objc private func keyboardWillChangeFrame(_ notification: Notification) {
        guard
            let endFrame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect,
            let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double,
            let curveRaw = notification.userInfo?[UIResponder.keyboardAnimationCurveUserInfoKey] as? UInt,
            let window   = view.window
        else { return }

        let kbFrameInView  = view.convert(endFrame, from: window.screen.coordinateSpace)
        let newKbHeight    = max(0, view.bounds.height - kbFrameInView.origin.y)

        guard newKbHeight != keyboardHeight else { return }
        keyboardHeight = newKbHeight

        let safeBottom = view.safeAreaInsets.bottom
        // When keyboard is visible — sit flush on top of it (no safe area needed, keyboard covers home indicator).
        // When keyboard is hidden — respect safe area so input bar clears the home indicator.
        let newConstant = newKbHeight > 0 ? -newKbHeight : -safeBottom

        let distFromBottom = collectionView.contentSize.height
            - collectionView.contentOffset.y
            - collectionView.bounds.height

        let updates = {
            self.inputBarBottomConstraint.constant = newConstant
            self.view.layoutIfNeeded()

            let newOffset = self.collectionView.contentSize.height
                - self.collectionView.bounds.height
                - distFromBottom
            if newOffset > -self.collectionView.contentInset.top {
                self.collectionView.contentOffset = CGPoint(x: 0, y: newOffset)
            }
        }

        if duration > 0 {
            UIView.animate(
                withDuration: duration,
                delay: 0,
                options: UIView.AnimationOptions(rawValue: curveRaw << 16).union(.allowUserInteraction),
                animations: updates
            )
        } else {
            updates()
        }
    }

    // MARK: - Layout

    private func makeLayout() -> UICollectionViewLayout {
        UICollectionViewCompositionalLayout { [weak self] _, _ in self?.makeSectionLayout() }
    }

    private func makeSectionLayout() -> NSCollectionLayoutSection {
        let size  = NSCollectionLayoutSize(widthDimension: .fractionalWidth(1), heightDimension: .estimated(60))
        let item  = NSCollectionLayoutItem(layoutSize: size)
        let group = NSCollectionLayoutGroup.vertical(layoutSize: size, subitems: [item])
        let section = NSCollectionLayoutSection(group: group)
        section.interGroupSpacing = 2

        let headerSize = NSCollectionLayoutSize(widthDimension: .fractionalWidth(1), heightDimension: .absolute(36))
        let header = NSCollectionLayoutBoundarySupplementaryItem(
            layoutSize: headerSize,
            elementKind: UICollectionView.elementKindSectionHeader,
            alignment: .top
        )
        header.pinToVisibleBounds = true
        section.boundarySupplementaryItems = [header]
        return section
    }

    // MARK: - Data Source

    private func setupDataSource() {
        dataSource = UICollectionViewDiffableDataSource<String, String>(
            collectionView: collectionView
        ) { [weak self] cv, ip, id in
            self?.cellForItem(at: ip, itemID: id, collectionView: cv)
        }
        dataSource.supplementaryViewProvider = { [weak self] cv, kind, ip in
            guard kind == UICollectionView.elementKindSectionHeader, let self else { return nil }
            let v = cv.dequeueReusableSupplementaryView(
                ofKind: kind, withReuseIdentifier: DateSeparatorView1.reuseID, for: ip
            ) as? DateSeparatorView1
            v?.configure(with: DateHelper.shared.sectionTitle(from: self.sections[ip.section].dateKey))
            return v
        }
    }

    private func cellForItem(at ip: IndexPath, itemID: String, collectionView: UICollectionView) -> UICollectionViewCell? {
        guard let msg = message(forID: itemID) else { return nil }
        let cell = collectionView.dequeueReusableCell(
            withReuseIdentifier: MessageCell.reuseID, for: ip
        ) as? MessageCell
        cell?.messageResolver = { [weak self] id in self?.message(forID: id) }
        cell?.configure(with: msg, maxBubbleWidth: collectionView.bounds.width * 0.80)
        cell?.onReplyTap = { [weak self] replyId in
            guard let self else { return }
            self.delegate?.chatViewController(self, didTapReply: replyId)
        }
        return cell
    }

    // MARK: - Empty / Loading

    private func updateLoadingState() {
        let noMessages = sections.isEmpty || sections.allSatisfy { $0.messages.isEmpty }
        if noMessages {
            emptyStateContainer.isHidden = false
            if isLoading {
                emptyStateLabel.isHidden = true
                centerSpinner.startAnimating()
            } else {
                centerSpinner.stopAnimating()
                emptyStateLabel.isHidden = false
            }
        } else {
            centerSpinner.stopAnimating()
            emptyStateContainer.isHidden = true
        }
    }

    // MARK: - Data Management

    func updateMessages(_ messages: [ChatMessage]) {
        let newCount = messages.count
        let oldCount = lastKnownMessageCount

        let newSections = buildSections(from: messages)

        if newCount > oldCount && oldCount > 0 && isPrepend(newSections: newSections) {
            // ── Zero-jump prepend ────────────────────────────────────────────────
            sections = newSections

            CATransaction.begin()
            CATransaction.setDisableActions(true)

            let oldH    = collectionView.contentSize.height
            let oldOffY = collectionView.contentOffset.y

            dataSource.apply(buildSnapshot(), animatingDifferences: false)
            collectionView.layoutIfNeeded()

            let delta = collectionView.contentSize.height - oldH
            isProgrammaticScroll = true
            collectionView.contentOffset = CGPoint(
                x: 0,
                y: max(-collectionView.contentInset.top, oldOffY + delta)
            )
            isProgrammaticScroll = false

            CATransaction.commit()

        } else if newCount < oldCount {
            // ── Deletion ─────────────────────────────────────────────────────────
            // Find which IDs were removed so we can reconfigure reply cells.
            let oldIDs = Set(sections.flatMap { $0.messages.map { $0.id } })
            sections = newSections
            let newIDs = Set(sections.flatMap { $0.messages.map { $0.id } })
            let removedIDs = oldIDs.subtracting(newIDs)

            var snap = buildSnapshot()
            // Reconfigure any message that referenced a deleted message as reply.
            if !removedIDs.isEmpty {
                let replyingIDs = sections
                    .flatMap { $0.messages }
                    .filter { msg in
                        guard let replyId = msg.replyTo?.id else { return false }
                        return removedIDs.contains(replyId)
                    }
                    .map { $0.id }
                if !replyingIDs.isEmpty {
                    snap.reconfigureItems(replyingIDs)
                }
            }
            dataSource.apply(snap, animatingDifferences: true)

        } else if newCount > oldCount {
            // ── Append ───────────────────────────────────────────────────────────
            // IMPORTANT: set sections BEFORE buildSnapshot() so snapshot contains
            // new IDs, but dataSource still holds old snapshot → correct diff → animation.
            sections = newSections
            let snap = buildSnapshot()
            dataSource.apply(snap, animatingDifferences: true) { [weak self] in
                self?.scrollToBottomIfNearBottom()
            }

        } else {
            // ── In-place update (status, edit) ────────────────────────────────────
            sections = newSections
            var snap = dataSource.snapshot()
            snap.reconfigureItems(snap.itemIdentifiers)
            dataSource.apply(snap, animatingDifferences: false)
        }

        updateLoadingState()
        updateFABVisibility(animated: false)

        if waitingForNewMessages && newCount > oldCount { waitingForNewMessages = false }
        lastKnownMessageCount = newCount
    }

    private func isPrepend(newSections: [MessageSection]) -> Bool {
        guard let oldestKnown = sections.first?.messages.first?.timestamp else { return false }
        let newTimestamps = newSections.flatMap { $0.messages.map { $0.timestamp } }
        let addedCount    = newTimestamps.count - lastKnownMessageCount
        guard addedCount > 0 else { return false }
        // All added timestamps must be older than oldest existing
        let added = Array(newTimestamps.prefix(addedCount))
        return added.allSatisfy { $0 < oldestKnown }
    }

    private func scrollToBottomIfNearBottom() {
        guard distanceFromBottom() < scrollToBottomThreshold + 50 else { return }
        scrollToBottom(animated: true)
    }

    private func buildSections(from messages: [ChatMessage]) -> [MessageSection] {
        var map: [String: MessageSection] = [:]
        var order: [String] = []
        for msg in messages.sorted(by: { $0.timestamp < $1.timestamp }) {
            if map[msg.groupDate] == nil {
                map[msg.groupDate] = MessageSection(
                    dateString: DateHelper.shared.sectionTitle(from: msg.groupDate),
                    dateKey: msg.groupDate, messages: []
                )
                order.append(msg.groupDate)
            }
            map[msg.groupDate]?.messages.append(msg)
        }
        return order.compactMap { map[$0] }
    }

    private func buildSnapshot() -> NSDiffableDataSourceSnapshot<String, String> {
        var snap = NSDiffableDataSourceSnapshot<String, String>()
        for section in sections {
            snap.appendSections([section.dateKey])
            snap.appendItems(section.messages.map { $0.id }, toSection: section.dateKey)
        }
        return snap
    }

    private func message(forID id: String) -> ChatMessage? {
        sections.lazy.flatMap { $0.messages }.first { $0.id == id }
    }

    // MARK: - Reply

    func setReplyMessage(_ message: ChatMessage?) { replyMessage = message }

    // MARK: - Context Menu

    private func makeContextMenu(for message: ChatMessage) -> UIMenu {
        UIMenu(title: "", children: actions.map { action in
            UIAction(
                title: action.title,
                image: action.systemImage.flatMap { UIImage(systemName: $0) },
                attributes: action.isDestructive ? .destructive : []
            ) { [weak self] _ in
                guard let self else { return }
                self.delegate?.chatViewController(self, didSelectAction: action, for: message)
            }
        })
    }

    // MARK: - Scroll

    func scrollToBottom(animated: Bool) {
        guard let last = sections.last, !last.messages.isEmpty else { return }
        let section = sections.count - 1
        let item = last.messages.count - 1
        let ip = IndexPath(item: item, section: section)

        // If contentSize is not yet computed, force layout first
        if collectionView.contentSize.height <= 0 {
            collectionView.layoutIfNeeded()
        }

        collectionView.scrollToItem(at: ip, at: .bottom, animated: animated)
    }

    func scrollToMessage(id: String, position: ChatScrollPosition = .center,
                         animated: Bool = true, highlight: Bool = true) {
        guard let ip = indexPath(forMessageID: id) else { return }
        collectionView.scrollToItem(at: ip, at: position.collectionViewPosition, animated: animated)
        guard highlight else { return }
        let delay = animated ? 0.35 : 0.05
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            self?.highlightCell(at: ip)
        }
    }

    private func indexPath(forMessageID id: String) -> IndexPath? {
        for (si, section) in sections.enumerated() {
            if let ii = section.messages.firstIndex(where: { $0.id == id }) {
                return IndexPath(item: ii, section: si)
            }
        }
        return nil
    }

    private func highlightCell(at ip: IndexPath) {
        if let cell = collectionView.cellForItem(at: ip) as? MessageCell { cell.highlight(); return }
        DispatchQueue.main.async { [weak self] in
            (self?.collectionView.cellForItem(at: ip) as? MessageCell)?.highlight()
        }
    }
}

// MARK: - UICollectionViewDelegate

extension ChatViewController: UICollectionViewDelegate {

    func collectionView(_ collectionView: UICollectionView,
                        didSelectItemAt indexPath: IndexPath) {
        guard let id = dataSource.itemIdentifier(for: indexPath),
              let msg = message(forID: id) else { return }
        delegate?.chatViewController(self, didTapMessage: msg)
    }

    // MARK: Context Menu — standard iOS preview

    func collectionView(_ collectionView: UICollectionView,
                        contextMenuConfigurationForItemAt indexPath: IndexPath,
                        point: CGPoint) -> UIContextMenuConfiguration? {
        guard !actions.isEmpty,
              let id  = dataSource.itemIdentifier(for: indexPath),
              let msg = message(forID: id) else { return nil }

        return UIContextMenuConfiguration(identifier: nil, previewProvider: nil) { [weak self] _ in
            guard let self else { return UIMenu() }
            return self.makeContextMenu(for: msg)
        }
    }

    // MARK: Visibility

    func collectionView(_ collectionView: UICollectionView,
                        willDisplay cell: UICollectionViewCell,
                        forItemAt indexPath: IndexPath) {
        guard let id = dataSource.itemIdentifier(for: indexPath) else { return }
        if visibleMessageIDs.insert(id).inserted {
            delegate?.chatViewController(self, messagesDidAppear: [id])
        }
    }

    // MARK: Scroll

    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        let offset = scrollView.contentOffset
        let dy     = offset.y - lastContentOffsetY
        lastContentOffsetY = offset.y

        guard !isProgrammaticScroll else { return }

        delegate?.chatViewController(self, didScrollToOffset: offset)

        // FAB visibility — animate only on user-driven scroll
        updateFABVisibility(animated: true)

        // Load-more: only when scrolling up toward older messages
        let topDistance = offset.y + scrollView.contentInset.top
        if dy < 0, topDistance < topThreshold, !waitingForNewMessages {
            waitingForNewMessages = true
            delegate?.chatViewController(self, didReachTopThreshold: topDistance)
        }
    }
}

// MARK: - InputBarDelegate

extension ChatViewController: InputBarDelegate {
    func inputBar(_ inputBar: InputBarView, didSendText text: String, replyToId: String?) {
        delegate?.chatViewController(self, didSendMessage: text, replyToId: replyToId)
    }
    func inputBar(_ inputBar: InputBarView, didChangeHeight height: CGFloat) {
        UIView.animate(withDuration: 0.2) { self.view.layoutIfNeeded() }
    }
    func inputBarDidTapAttachment(_ inputBar: InputBarView) {
        delegate?.chatViewControllerDidTapAttachment(self)
    }
}

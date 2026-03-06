import UIKit

// MARK: - UICollectionViewDelegate

extension ChatViewController: UICollectionViewDelegate {

    func collectionView(_ cv: UICollectionView, didSelectItemAt ip: IndexPath) {
        guard let id = dataSource.itemIdentifier(for: ip), let msg = messageIndex[id] else { return }
        delegate?.chatViewController(self, didTapMessage: msg)
    }

    func collectionView(_ cv: UICollectionView, willDisplay cell: UICollectionViewCell, forItemAt ip: IndexPath) {
        guard
            let id  = dataSource.itemIdentifier(for: ip),
            let msg = messageIndex[id],
            !msg.isMine,
            visibleMessageIDs.insert(id).inserted
        else { return }
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

    func scrollViewDidEndScrollingAnimation(_ scrollView: UIScrollView) {
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
}

// MARK: - UICollectionViewDelegateFlowLayout

extension ChatViewController: UICollectionViewDelegateFlowLayout {

    func collectionView(_ cv: UICollectionView, layout: UICollectionViewLayout, sizeForItemAt ip: IndexPath) -> CGSize {
        guard let id = dataSource.itemIdentifier(for: ip), let msg = messageIndex[id] else {
            return CGSize(width: cv.bounds.width, height: 44)
        }
        return sizeCache.size(for: msg, hasReply: replyExists(for: msg), collectionViewWidth: cv.bounds.width)
    }

    func collectionView(_ cv: UICollectionView, layout: UICollectionViewLayout,
                         referenceSizeForHeaderInSection section: Int) -> CGSize {
        CGSize(width: cv.bounds.width, height: 36)
    }

    func collectionView(_ cv: UICollectionView, layout: UICollectionViewLayout,
                         insetForSectionAt section: Int) -> UIEdgeInsets { .zero }
}

// MARK: - Flow Layout Factory

extension ChatViewController {

    /// Создаёт UICollectionViewFlowLayout с настройками для вертикального чата.
    func makeFlowLayout() -> UICollectionViewFlowLayout {
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection                  = .vertical
        layout.minimumLineSpacing               = ChatLayoutConstants.lineSpacing
        layout.minimumInteritemSpacing          = 0
        layout.sectionHeadersPinToVisibleBounds = true
        return layout
    }
}

// MARK: - Context Menu

extension ChatViewController {

    /// Добавляет UILongPressGestureRecognizer на bubbleView ячейки.
    /// Жест на subview (не на collectionView) автоматически разрешает конфликты через UIKit:
    /// отменяет tap replyPreview и selection коллекции, не затрагивая pan-жест скролла.
    func attachLongPress(to cell: MessageCell, message: ChatMessage) {
        let gr = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress(_:)))
        gr.minimumPressDuration = 0.4
        gr.cancelsTouchesInView = true
        gr.message = message
        cell.bubbleSnapshotView.addGestureRecognizer(gr)
    }

    @objc private func handleLongPress(_ gr: UILongPressGestureRecognizer) {
        guard gr.state == .began, let message = gr.message, !actions.isEmpty, let source = gr.view else { return }
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        freezeCollectionBottomInset()
        inputBar.textView.resignFirstResponder()
        showContextMenu(for: message, sourceView: source)
    }

    /// Формирует ContextMenuConfiguration и показывает ContextMenuViewController.
    private func showContextMenu(for message: ChatMessage, sourceView: UIView) {
        let config = ContextMenuConfiguration(
            id:         message.id,
            sourceView: sourceView,
            emojis:     contextMenuEmojis,
            actions:    actions.map {
                ContextMenuAction(id: $0.id, title: $0.title,
                                  systemImage: $0.systemImage, isDestructive: $0.isDestructive)
            }
        )
        ContextMenuViewController.present(
            configuration: config,
            theme:         theme.isDark ? .dark : .light,
            from:          self,
            delegate:      self
        )
    }
}

// MARK: - UILongPressGestureRecognizer + message

private var messageKey: UInt8 = 0

private extension UILongPressGestureRecognizer {
    var message: ChatMessage? {
        get { objc_getAssociatedObject(self, &messageKey) as? ChatMessage }
        set { objc_setAssociatedObject(self, &messageKey, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC) }
    }
}

// MARK: - ContextMenuDelegate

extension ChatViewController: ContextMenuDelegate {

    /// Закрывает меню, восстанавливает клавиатуру и передаёт выбранный emoji делегату чата.
    func contextMenu(_ menu: ContextMenuViewController, didSelectEmoji emoji: String, forId id: String) {
        let restore = prepareRestoreCollectionBottomInset()
        menu.presentingViewController?.dismiss(animated: false) { [weak self] in
            restore()
            guard let self, let msg = self.messageIndex[id] else { return }
            self.delegate?.chatViewController(self, didSelectEmojiReaction: emoji, for: msg)
        }
    }

    /// Закрывает меню, восстанавливает клавиатуру и передаёт выбранное действие делегату чата.
    func contextMenu(_ menu: ContextMenuViewController, didSelectAction action: ContextMenuAction, forId id: String) {
        let restore = prepareRestoreCollectionBottomInset()
        menu.presentingViewController?.dismiss(animated: false) { [weak self] in
            restore()
            guard let self, let msg = self.messageIndex[id] else { return }
            let mapped = MessageAction(id: action.id, title: action.title,
                                       systemImage: action.systemImage, isDestructive: action.isDestructive)
            self.delegate?.chatViewController(self, didSelectAction: mapped, for: msg)
        }
    }

    /// Закрывает меню без выбора и восстанавливает клавиатуру.
    func contextMenuDidDismiss(_ menu: ContextMenuViewController, id: String) {
        let restore = prepareRestoreCollectionBottomInset()
        menu.presentingViewController?.dismiss(animated: false) { restore() }
    }
}

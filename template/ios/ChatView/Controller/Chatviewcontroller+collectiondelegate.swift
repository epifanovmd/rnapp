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

        let now = CACurrentMediaTime()
        guard now - lastScrollEventTime >= scrollThrottleInterval else { return }
        lastScrollEventTime = now

        // FAB обновляется с тем же throttle-интервалом, что и скролл-событие
        updateFABVisibility(animated: true)

        guard !isProgrammaticScroll else { return }

        delegate?.chatViewController(self, didScrollToOffset: offset)

        // Reach top — load older messages
        let topDist = offset.y + scrollView.contentInset.top
        if dy < 0, topDist < topThreshold, !waitingForNewMessages, hasMore {
            waitingForNewMessages = true
            delegate?.chatViewController(self, didReachTopThreshold: topDist)
        }

        // Reach bottom — load newer messages (detached mode)
        let contentH  = scrollView.contentSize.height
        let frameH    = scrollView.bounds.height
        let bottomInset = scrollView.contentInset.bottom
        let bottomDist = contentH - offset.y - frameH + bottomInset
        if dy > 0, bottomDist < bottomThreshold, !waitingForNewerMessages, hasNewer {
            waitingForNewerMessages = true
            delegate?.chatViewController(self, didReachBottomThreshold: bottomDist)
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

    /// Показывает контекстное меню для сообщения.
    /// Long press регистрируется в MessageCell.init() — GR создаётся один раз,
    /// не накапливается при dequeue ячеек.
    func showContextMenu(for message: ChatMessage, sourceView: UIView) {
        let config = ContextMenuConfiguration(
            id:                   message.id,
            sourceView:           sourceView,
            emojis:               contextMenuEmojis,
            actions:              message.actions.map {
                ContextMenuAction(id: $0.id, title: $0.title,
                                  systemImage: $0.systemImage, isDestructive: $0.isDestructive)
            },
            snapshotCornerRadius: ChatLayoutConstants.bubbleCornerRadius
        )
        ContextMenuViewController.present(
            configuration: config,
            theme:         theme.isDark ? .dark : .light,
            from:          self,
            delegate:      self
        )
    }
}

// MARK: - ContextMenuDelegate

extension ChatViewController: ContextMenuDelegate {

    // ContextMenuViewController сам вызывает dismiss внутри close() перед тем как
    // позвать делегата. К моменту вызова этих методов меню уже снято с экрана.
    // Поэтому здесь только восстанавливаем inset и передаём событие выше.

    func contextMenu(_ menu: ContextMenuViewController, didSelectEmoji emoji: String, forId id: String) {
        restoreCollectionBottomInset()
        guard let msg = messageIndex[id] else { return }
        delegate?.chatViewController(self, didSelectEmojiReaction: emoji, for: msg)
    }

    func contextMenu(_ menu: ContextMenuViewController, didSelectAction action: ContextMenuAction, forId id: String) {
        restoreCollectionBottomInset()
        guard let msg = messageIndex[id] else { return }
        let mapped = MessageAction(id: action.id, title: action.title,
                                   systemImage: action.systemImage, isDestructive: action.isDestructive)
        delegate?.chatViewController(self, didSelectAction: mapped, for: msg)
    }

    func contextMenuDidDismiss(_ menu: ContextMenuViewController, id: String) {
        restoreCollectionBottomInset()
    }
}

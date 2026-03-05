import UIKit

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

        return UIContextMenuConfiguration(
            identifier: NSString(string: id),
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

    func collectionView(
        _ cv: UICollectionView,
        willDisplay cell: UICollectionViewCell,
        forItemAt ip: IndexPath
    ) {
        guard let id  = dataSource.itemIdentifier(for: ip),
              let msg = messageIndex[id],
              !msg.isMine,
              visibleMessageIDs.insert(id).inserted else { return }
        scheduleVisibilityFlush(id: id)
    }

    // MARK: Scroll events

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

// MARK: - Context menu

private extension ChatViewController {

    func makeContextMenu(for message: ChatMessage) -> UIMenu {
        UIMenu(title: "", children: actions.map { action in
            UIAction(
                title: action.title,
                image: action.systemImage.flatMap { UIImage(systemName: $0) },
                attributes: action.isDestructive ? .destructive : []
            ) { [weak self] _ in
                guard let self else { return }
                delegate?.chatViewController(self, didSelectAction: action, for: message)
            }
        })
    }

    func targetedPreview(
        for config: UIContextMenuConfiguration,
        in cv: UICollectionView
    ) -> UITargetedPreview? {
        guard let id   = config.identifier as? String,
              let ip   = indexPath(forMessageID: id),
              let cell = cv.cellForItem(at: ip) as? MessageCell
        else { return nil }
        return cell.makeTargetedPreview()
    }
}

// MARK: - Flow layout factory

extension ChatViewController {

    func makeFlowLayout() -> UICollectionViewFlowLayout {
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection               = .vertical
        layout.minimumLineSpacing            = ChatLayoutConstants.lineSpacing
        layout.minimumInteritemSpacing       = 0
        layout.sectionHeadersPinToVisibleBounds = true
        return layout
    }
}

// MARK: - Chatviewcontroller_collectiondelegate.swift
// UPDATED: Нативное UIContextMenu заменено на ContextMenuViewController.
// При открытии меню — скрывается клавиатура с сохранением отступа коллекции.

import UIKit

// MARK: - UICollectionViewDelegate

extension ChatViewController: UICollectionViewDelegate {

    func collectionView(_ cv: UICollectionView, didSelectItemAt ip: IndexPath) {
        guard let id = dataSource.itemIdentifier(for: ip), let msg = messageIndex[id] else { return }
        delegate?.chatViewController(self, didTapMessage: msg)
    }

    // MARK: - Long press → кастомное контекстное меню

    // Нативные методы UIContextMenu убраны — теперь используем ContextMenuViewController.
    // Long press добавляется через setupLongPressGesture() в ChatViewController+ContextMenu.
    // (см. ниже в этом же файле)

    // MARK: - willDisplay / Scroll

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
        return sizeCache.size(for: msg, hasReply: replyExists(for: msg), collectionViewWidth: cv.bounds.width)
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

// MARK: - Flow layout

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

// MARK: - ChatViewController+ContextMenu

extension ChatViewController {

    // MARK: Setup

    /// Вызывать из viewDidLoad после setupCollectionView().
    func setupLongPressGesture() {
        let lpgr = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress(_:)))
        lpgr.minimumPressDuration = 0.35
        lpgr.cancelsTouchesInView = false
        collectionView.addGestureRecognizer(lpgr)
    }

    // MARK: Long press handler

    @objc func handleLongPress(_ gr: UILongPressGestureRecognizer) {
        guard gr.state == .began else { return }

        let point = gr.location(in: collectionView)
        guard
            let ip   = collectionView.indexPathForItem(at: point),
            let id   = dataSource.itemIdentifier(for: ip),
            let msg  = messageIndex[id],
            let cell = collectionView.cellForItem(at: ip) as? MessageCell,
            !actions.isEmpty
        else { return }

        // Haptic
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()

        // Запоминаем отступ коллекции ПЕРЕД скрытием клавиатуры
        freezeCollectionBottomInset()

        // Скрываем клавиатуру без анимации (чтобы отступ остался)
        inputBar.textView.resignFirstResponder()

        // Небольшая задержка — дать resignFirstResponder отработать
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.02) { [weak self] in
            guard let self else { return }
            self.presentCustomContextMenu(for: msg, sourceView: cell.bubbleSnapshotView)
        }
    }

    // MARK: Present menu

    private func presentCustomContextMenu(for message: ChatMessage, sourceView: UIView) {
        let emojis  = contextMenuEmojis
        let menuActions = actions.map { a in
            ContextMenuAction(
                id:            a.id,
                title:         a.title,
                systemImage:   a.systemImage,
                isDestructive: a.isDestructive
            )
        }

        let config = ContextMenuConfiguration(
            id:         message.id,
            sourceView: sourceView,
            emojis:     emojis,
            actions:    menuActions
        )

        let menuTheme: ContextMenuTheme = theme.isDark ? .dark : .light

        let menuVC = ContextMenuViewController(configuration: config, theme: menuTheme)
        menuVC.delegate = self
        menuVC.modalPresentationStyle = .overFullScreen
        menuVC.modalTransitionStyle   = .crossDissolve
        present(menuVC, animated: false)
    }
}

// MARK: - ContextMenuDelegate

extension ChatViewController: ContextMenuDelegate {

    func contextMenu(_ menu: ContextMenuViewController, didSelectEmoji emoji: String, forId id: String) {
        restoreCollectionBottomInset()
        guard let msg = messageIndex[id] else { return }
        delegate?.chatViewController(self, didSelectEmojiReaction: emoji, for: msg)
    }

    func contextMenu(_ menu: ContextMenuViewController, didSelectAction action: ContextMenuAction, forId id: String) {
        restoreCollectionBottomInset()
        guard let msg = messageIndex[id] else { return }
        let msgAction = MessageAction(
            id:            action.id,
            title:         action.title,
            systemImage:   action.systemImage,
            isDestructive: action.isDestructive
        )
        delegate?.chatViewController(self, didSelectAction: msgAction, for: msg)
    }

    func contextMenuDidDismiss(_ menu: ContextMenuViewController, id: String) {
        restoreCollectionBottomInset()
    }
}

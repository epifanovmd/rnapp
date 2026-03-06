// MARK: - Chatviewcontroller_collectiondelegate.swift
//
// ЖЕСТЫ — правильная архитектура:
//
// Проблема кастомного UILongPressGestureRecognizer на collectionView:
//   • cancelsTouchesInView = true  → блокирует reply tap, но тоже блокирует скролл
//   • cancelsTouchesInView = false → reply tap срабатывает вместе с long press
//
// Решение: добавляем long press на bubbleView каждой ячейки (не на collectionView).
// Жест живёт рядом с replyPreview.tapGestureRecognizer и мы явно требуем
// чтобы tap реплая упал (require toFail) перед long press → не нужен.
// Вместо этого: long press на bubbleView с cancelsTouchesInView = true.
// Когда он срабатывает — он отменяет тап реплая автоматически (они в одной иерархии).
// didSelectItemAt не срабатывает т.к. collectionView.allowsSelection обрабатывается
// через UICollectionView hit-test который идёт через contentView, а не через bubbleView.
//
// Фактически: long press на bubbleView + cancelsTouchesInView = true — это
// канонический способ. Тап ячейки (didSelectItemAt) — через отдельный recognizer
// на contentView, который требует фейла от long press.

import UIKit

// MARK: - UICollectionViewDelegate

extension ChatViewController: UICollectionViewDelegate {

    func collectionView(_ cv: UICollectionView, didSelectItemAt ip: IndexPath) {
        guard let id = dataSource.itemIdentifier(for: ip), let msg = messageIndex[id] else { return }
        delegate?.chatViewController(self, didTapMessage: msg)
    }

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

// MARK: - ContextMenu gesture

extension ChatViewController {

    /// Вызывается из datasource при создании ячейки.
    /// Добавляет UILongPressGestureRecognizer непосредственно на bubbleView ячейки.
    ///
    /// Почему на bubbleView, а не на collectionView:
    ///   1. Жест живёт в той же view-иерархии, что и replyPreview tap —
    ///      UIKit автоматически разрешает конфликт: long press (0.4с) побеждает tap
    ///      потому что tap requires failure от long press (стандартное поведение UIKit
    ///      когда оба recognizer на одном view или parent/child).
    ///   2. cancelsTouchesInView = true отменяет только тачи в bubbleView и ниже,
    ///      не трогая скролл collectionView (pan gesture живёт выше по иерархии).
    ///   3. didSelectItemAt не вызывается: UICollectionView обрабатывает selection
    ///      через свой internal tap, который тоже требует фейла от long press
    ///      когда recognizer на subview ячейки.
    func attachLongPress(to cell: MessageCell,
                         message: ChatMessage) {
        let lp = UILongPressGestureRecognizer(target: self, action: #selector(handleBubbleLongPress(_:)))
        lp.minimumPressDuration = 0.4
        lp.cancelsTouchesInView = true   // отменяет reply tap при срабатывании
        // Не нужен delegate и не нужен require(toFail:) — UIKit сам разрешает
        // конфликт между long press и shorter gestures в той же иерархии.
        cell.bubbleSnapshotView.addGestureRecognizer(lp)
        // Сохраняем ссылку на message через associated object recognizer
        objc_setAssociatedObject(lp, &longPressMessageKey, message, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }

    @objc private func handleBubbleLongPress(_ gr: UILongPressGestureRecognizer) {
        guard gr.state == .began else { return }

        guard
            let message = objc_getAssociatedObject(gr, &longPressMessageKey) as? ChatMessage,
            !actions.isEmpty
        else { return }

        // Haptic — вручную, т.к. мы не используем UIContextMenuInteraction
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()

        guard let sourceView = gr.view else { return }

        freezeCollectionBottomInset()
        inputBar.textView.resignFirstResponder()
        presentCustomContextMenu(for: message, sourceView: sourceView)
    }

    private func presentCustomContextMenu(for message: ChatMessage, sourceView: UIView) {
        let menuActions = actions.map { a in
            ContextMenuAction(id: a.id, title: a.title,
                              systemImage: a.systemImage, isDestructive: a.isDestructive)
        }
        let config = ContextMenuConfiguration(
            id: message.id, sourceView: sourceView,
            emojis: contextMenuEmojis, actions: menuActions
        )
        let menuVC = ContextMenuViewController(
            configuration: config,
            theme: theme.isDark ? .dark : .light
        )
        menuVC.delegate = self
        menuVC.modalPresentationStyle = .overFullScreen
        menuVC.modalTransitionStyle   = .crossDissolve
        present(menuVC, animated: false)
    }
}

private var longPressMessageKey: UInt8 = 0

// MARK: - ContextMenuDelegate

extension ChatViewController: ContextMenuDelegate {

    func contextMenu(_ menu: ContextMenuViewController, didSelectEmoji emoji: String, forId id: String) {
        let restore = prepareRestoreCollectionBottomInset()
        menu.presentingViewController?.dismiss(animated: false) { [weak self] in
            restore()
            guard let self, let msg = self.messageIndex[id] else { return }
            self.delegate?.chatViewController(self, didSelectEmojiReaction: emoji, for: msg)
        }
    }

    func contextMenu(_ menu: ContextMenuViewController, didSelectAction action: ContextMenuAction, forId id: String) {
        let restore = prepareRestoreCollectionBottomInset()
        menu.presentingViewController?.dismiss(animated: false) { [weak self] in
            restore()
            guard let self, let msg = self.messageIndex[id] else { return }
            let msgAction = MessageAction(id: action.id, title: action.title,
                                          systemImage: action.systemImage,
                                          isDestructive: action.isDestructive)
            self.delegate?.chatViewController(self, didSelectAction: msgAction, for: msg)
        }
    }

    func contextMenuDidDismiss(_ menu: ContextMenuViewController, id: String) {
        let restore = prepareRestoreCollectionBottomInset()
        menu.presentingViewController?.dismiss(animated: false) { restore() }
    }
}

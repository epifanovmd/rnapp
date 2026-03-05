import UIKit

// MARK: - Keyboard & collection inset

extension ChatViewController {

    // MARK: Content inset
    //
    // collectionView занимает весь экран (bottom = view.bottom).
    // Нижний contentInset = пространство от низа view до верха inputBar.
    // viewDidLayoutSubviews вызывается в каждом кадре анимации keyboardLayoutGuide,
    // поэтому inset обновляется покадрово — контент поднимается вместе с клавиатурой.

    func updateCollectionBottomInset() {
        guard inputBar.frame.height > 0, view.bounds.height > 0 else { return }

        // contentInset.bottom: вся зона под inputBar + визуальный padding + доп. отступ из RN.
        let newBottom = view.bounds.height
            - inputBar.frame.minY
            + ChatLayoutConstants.collectionBottomPadding
            + collectionExtraInsetBottom

        // scrollIndicatorInsets.bottom: расстояние от низа view до верха inputBar,
        // минус внутренний вертикальный padding containerView.
        // Без этой поправки полоска заканчивается на inputBarVerticalPadding выше контента.
        let newIndicatorBottom = view.bounds.height
            - inputBar.frame.minY
            - ChatLayoutConstants.collectionBottomPadding

        let oldBottom = collectionView.contentInset.bottom
        guard abs(oldBottom - newBottom) > 0.5 else { return }

        let cv = collectionView!

        // Во время интерактивного dismiss UIKit сам управляет contentOffset.
        // Мы только синхронизируем inset, не трогая offset.
        if isUserDragging {
            cv.contentInset.bottom         = newBottom
            cv.verticalScrollIndicatorInsets.bottom = newIndicatorBottom
            return
        }

        // Сохраняем расстояние от текущей позиции до конца контента.
        // Восстановив его после смены inset, получаем плавный подъём контента.
        let distanceFromEnd = cv.contentSize.height
            - cv.contentOffset.y
            - cv.bounds.height
            + oldBottom

        cv.contentInset.bottom          = newBottom
        cv.verticalScrollIndicatorInsets.bottom = newIndicatorBottom

        let newOffsetY = cv.contentSize.height - cv.bounds.height + newBottom - distanceFromEnd
        cv.contentOffset = CGPoint(x: 0, y: max(-cv.contentInset.top, newOffsetY))
    }
}

// MARK: - KeyboardListenerDelegate (iOS 13–14 fallback)

extension ChatViewController: KeyboardListenerDelegate {

    func keyboardWillChangeFrame(info: KeyboardInfo) {
        guard #unavailable(iOS 15) else { return }
        guard let window = view.window else { return }

        let kbInView   = view.convert(info.frameEnd, from: window.screen.coordinateSpace)
        let kbHeight   = max(0, view.bounds.height - kbInView.origin.y)
        let safeBottom = view.safeAreaInsets.bottom
        let newConst   = -(max(kbHeight, safeBottom) - safeBottom)

        guard (inputBarKeyboardConstraint?.constant ?? 0) != newConst else { return }
        inputBarKeyboardConstraint?.constant = newConst

        let curve = UIView.AnimationOptions(rawValue: UInt(info.animationCurve.rawValue) << 16)

        if info.animationDuration > 0 {
            UIView.animate(
                withDuration: info.animationDuration,
                delay: 0,
                options: [curve, .beginFromCurrentState]
            ) { self.view.layoutIfNeeded() }
        } else {
            view.layoutIfNeeded()
        }
    }
}

// MARK: - FAB (scroll-to-bottom button)

extension ChatViewController {

    @objc func fabTapped() { scrollToBottom(animated: true) }

    func updateFABVisibility(animated: Bool) {
        let show = distanceFromBottom() > scrollToBottomThreshold
        guard show != fabVisible else { return }
        fabVisible = show
        fabButton.isUserInteractionEnabled = show
        let alpha: CGFloat = show ? 1 : 0
        let scale: CGFloat = show ? 1 : 0.7

        if animated {
            UIView.animate(
                withDuration: 0.22, delay: 0,
                usingSpringWithDamping: 0.7, initialSpringVelocity: 0.3,
                options: .allowUserInteraction
            ) {
                self.fabButton.alpha     = alpha
                self.fabButton.transform = CGAffineTransform(scaleX: scale, y: scale)
            }
        } else {
            fabButton.alpha     = alpha
            fabButton.transform = CGAffineTransform(scaleX: scale, y: scale)
        }
    }

    func distanceFromBottom() -> CGFloat {
        let cv = collectionView!
        return max(0, cv.contentSize.height - cv.contentOffset.y - cv.bounds.height + cv.contentInset.bottom)
    }
}

// MARK: - Public scroll API

extension ChatViewController {

    func scrollToBottom(animated: Bool) {
        guard let last = sections.last, !last.messages.isEmpty else { return }
        if collectionView.contentSize.height <= 0 { collectionView.layoutIfNeeded() }
        collectionView.scrollToItem(
            at: IndexPath(item: last.messages.count - 1, section: sections.count - 1),
            at: .bottom,
            animated: animated
        )
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

    // MARK: Highlight

    func processPendingHighlight() {
        guard let id = pendingHighlightId else { return }
        pendingHighlightId = nil
        highlightMessage(id: id)
    }

    func highlightMessage(id: String) {
        guard let ip = indexPath(forMessageID: id) else { return }
        if let cell = collectionView.cellForItem(at: ip) as? MessageCell {
            cell.highlight()
            return
        }
        DispatchQueue.main.async { [weak self] in
            guard let self, let ip = self.indexPath(forMessageID: id) else { return }
            (self.collectionView.cellForItem(at: ip) as? MessageCell)?.highlight()
        }
    }

    func scrollToBottomIfNearBottom() {
        guard distanceFromBottom() < scrollToBottomThreshold + 50 else { return }
        scrollToBottom(animated: true)
    }
}

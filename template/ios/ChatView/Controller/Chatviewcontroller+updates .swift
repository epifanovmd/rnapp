import UIKit

// MARK: - Public messages API

extension ChatViewController {

    /// Главная точка входа для обновления сообщений.
    /// Определяет тип изменения и применяет оптимальную стратегию.
    func updateMessages(_ messages: [ChatMessage]) {
        let newCount    = messages.count
        let oldCount    = lastKnownMessageCount
        let newSections = buildSections(from: messages)
        let newIndex    = Dictionary(uniqueKeysWithValues: messages.map { ($0.id, $0) })

        if newCount > oldCount, oldCount > 0, isPrepend(newSections: newSections) {
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
        if waitingForNewMessages, newCount > oldCount { waitingForNewMessages = false }
        lastKnownMessageCount = newCount
    }

    func resetLoadingState() { waitingForNewMessages = false }
}

// MARK: - Update strategies

private extension ChatViewController {

    /// Добавление истории сверху: snapshot применяется без анимации,
    /// contentOffset сдвигается на высоту добавленного контента — без видимого прыжка.
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

        let oldHeight = collectionView.contentSize.height
        let oldOffset = collectionView.contentOffset.y
        dataSource.apply(buildSnapshot(), animatingDifferences: false)
        collectionView.layoutIfNeeded()

        if !isInitialScrollProtected {
            let delta = collectionView.contentSize.height - oldHeight
            isProgrammaticScroll = true
            collectionView.contentOffset = CGPoint(
                x: 0,
                y: max(-collectionView.contentInset.top, oldOffset + delta)
            )
            isProgrammaticScroll = false
        } else if let targetId = pendingScrollMessageId,
                  let ip = indexPath(forMessageID: targetId) {
            isProgrammaticScroll = true
            collectionView.scrollToItem(at: ip, at: .centeredVertically, animated: false)
            isProgrammaticScroll = false
        }

        CATransaction.commit()
    }

    /// Удаление сообщений с анимацией. Инвалидирует кэш затронутых ячеек.
    func applyDeletion(
        newSections: [MessageSection],
        newIndex: [String: ChatMessage]
    ) {
        let removedIDs = Set(messageIndex.keys).subtracting(newIndex.keys)
        sections     = newSections
        messageIndex = newIndex

        // Ячейки, цитирующие удалённые сообщения, тоже нужно перерисовать
        let affectedQuoteIDs: [String] = sections.flatMap(\.messages).compactMap { msg in
            guard let replyId = msg.reply?.replyToId, removedIDs.contains(replyId) else { return nil }
            return msg.id
        }
        sizeCache.invalidate(ids: removedIDs)
        sizeCache.invalidate(ids: affectedQuoteIDs)

        var snap = buildSnapshot()
        if !affectedQuoteIDs.isEmpty { snap.reloadItems(affectedQuoteIDs) }
        dataSource.apply(snap, animatingDifferences: true)
    }

    /// Добавление новых сообщений снизу с автоскроллом если пользователь у дна.
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

    /// Обновление существующих сообщений (статус, текст, редактирование).
    /// Также обновляет ячейки, чьи цитаты указывают на изменённые сообщения.
    func applyUpdate(
        newSections: [MessageSection],
        newIndex: [String: ChatMessage],
        messages: [ChatMessage]
    ) {
        let changedIDs = messages.compactMap { msg -> String? in
            guard let existing = messageIndex[msg.id] else { return msg.id }
            return existing == msg ? nil : msg.id
        }
        sections     = newSections
        messageIndex = newIndex
        guard !changedIDs.isEmpty else { return }

        let changedSet = Set(changedIDs)
        let quoteReaderIDs = sections.flatMap(\.messages).compactMap { msg -> String? in
            guard let replyId = msg.reply?.replyToId,
                  changedSet.contains(replyId),
                  !changedSet.contains(msg.id) else { return nil }
            return msg.id
        }

        let allToReconfigure = changedIDs + quoteReaderIDs
        sizeCache.invalidate(ids: allToReconfigure)
        var snap = dataSource.snapshot()
        snap.reconfigureItems(allToReconfigure)
        dataSource.apply(snap, animatingDifferences: false)
    }
}

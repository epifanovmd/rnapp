import UIKit

// MARK: - DataSource setup

extension ChatViewController {

    func setupDataSource() {
        dataSource = UICollectionViewDiffableDataSource<String, String>(
            collectionView: collectionView
        ) { [weak self] cv, ip, id in
            self?.cell(for: ip, id: id, in: cv)
        }

        dataSource.supplementaryViewProvider = { [weak self] cv, kind, ip in
            guard kind == UICollectionView.elementKindSectionHeader,
                  let self else { return nil }
            let view = cv.dequeueReusableSupplementaryView(
                ofKind: kind,
                withReuseIdentifier: DateSeparatorView.reuseID,
                for: ip
            ) as? DateSeparatorView
            view?.configure(
                with: DateHelper.shared.sectionTitle(from: sections[ip.section].dateKey),
                theme: theme
            )
            return view
        }
    }

    // MARK: Cell factory

    private func cell(for ip: IndexPath, id: String, in cv: UICollectionView) -> UICollectionViewCell? {
        guard let msg = messageIndex[id] else { return nil }
        let cell = cv.dequeueReusableCell(
            withReuseIdentifier: MessageCell.reuseID, for: ip
        ) as? MessageCell
        cell?.configure(
            with: msg,
            resolvedReply: resolveReply(for: msg),
            collectionViewWidth: cv.bounds.width,
            theme: theme
        )
        cell?.onReplyTap = { [weak self] replyId in
            guard let self else { return }
            delegate?.chatViewController(self, didTapReply: replyId)
        }
        return cell
    }
}

// MARK: - Sections & snapshot building

extension ChatViewController {

    /// Группирует сообщения по дате в секции.
    /// Хэш входных данных защищает от повторного пересчёта при одинаковых данных.
    func buildSections(from messages: [ChatMessage]) -> [MessageSection] {
        let newHash = messages.reduce(into: 0) { hash, msg in
            hash ^= msg.id.hashValue &+ msg.status.hashValue &+ msg.groupDate.hashValue
        }
        guard newHash != lastSectionsInputHash || sections.isEmpty else { return sections }
        lastSectionsInputHash = newHash

        var map:   [String: MessageSection] = [:]
        var order: [String] = []
        for msg in messages.sorted(by: { $0.timestamp < $1.timestamp }) {
            if map[msg.groupDate] == nil {
                map[msg.groupDate] = MessageSection(dateKey: msg.groupDate, messages: [])
                order.append(msg.groupDate)
            }
            map[msg.groupDate]?.messages.append(msg)
        }
        return order.compactMap { map[$0] }
    }

    func buildSnapshot() -> NSDiffableDataSourceSnapshot<String, String> {
        var snap = NSDiffableDataSourceSnapshot<String, String>()
        for section in sections {
            snap.appendSections([section.dateKey])
            snap.appendItems(section.messages.map(\.id), toSection: section.dateKey)
        }
        return snap
    }

    func isPrepend(newSections: [MessageSection]) -> Bool {
        guard let oldestTimestamp = sections.first?.messages.first?.timestamp else { return false }
        let allTimestamps = newSections.flatMap { $0.messages.map(\.timestamp) }
        let addedCount    = allTimestamps.count - lastKnownMessageCount
        guard addedCount > 0 else { return false }
        return allTimestamps.prefix(addedCount).allSatisfy { $0 < oldestTimestamp }
    }
}

// MARK: - Size cache & reply helpers

extension ChatViewController {

    /// Прогревает кэш размеров в фоне для списка сообщений.
    func warmCache(for messages: [ChatMessage], width: CGFloat) {
        guard width > 0 else { return }
        let uncached = messages.filter { !sizeCache.contains($0.id) }
        guard !uncached.isEmpty else { return }

        let hasReplyMap = Dictionary(uniqueKeysWithValues: uncached.map { ($0.id, replyExists(for: $0)) })
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.sizeCache.prefill(
                messages: uncached,
                hasReplyMap: hasReplyMap,
                collectionViewWidth: width
            )
        }
    }

    func resolveReply(for message: ChatMessage) -> ResolvedReply? {
        guard let reply = message.reply else { return nil }
        if let original = messageIndex[reply.replyToId] {
            return .found(ReplyDisplayInfo(from: original))
        }
        return .deleted
    }

    func replyExists(for message: ChatMessage) -> Bool {
        guard let id = message.reply?.replyToId else { return false }
        return messageIndex[id] != nil
    }

    func indexPath(forMessageID id: String) -> IndexPath? {
        for (sectionIndex, section) in sections.enumerated() {
            if let itemIndex = section.messages.firstIndex(where: { $0.id == id }) {
                return IndexPath(item: itemIndex, section: sectionIndex)
            }
        }
        return nil
    }
}

// MARK: - Visibility debounce

extension ChatViewController {

    /// Добавляет id в накапливаемую пачку и перезапускает debounce-таймер.
    /// После паузы скролла пачка уходит делегату одним вызовом.
    func scheduleVisibilityFlush(id: String) {
        pendingVisibleIDs.insert(id)
        visibilityDebounceTask?.cancel()

        let task = DispatchWorkItem { [weak self] in
            guard let self, !pendingVisibleIDs.isEmpty else { return }
            let batch = Array(pendingVisibleIDs)
            pendingVisibleIDs.removeAll()
            delegate?.chatViewController(self, messagesDidAppear: batch)
        }
        visibilityDebounceTask = task
        DispatchQueue.main.asyncAfter(deadline: .now() + visibilityDebounceInterval, execute: task)
    }
}

import UIKit

// MARK: - DataSource

extension ChatViewController {

    func setupDataSource() {
        dataSource = UICollectionViewDiffableDataSource<String, String>(
            collectionView: collectionView
        ) { [weak self] cv, ip, id in
            self?.cell(for: ip, id: id, in: cv)
        }

        dataSource.supplementaryViewProvider = { [weak self] cv, kind, ip in
            guard kind == UICollectionView.elementKindSectionHeader, let self else { return nil }
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

    private func cell(for ip: IndexPath, id: String, in cv: UICollectionView) -> UICollectionViewCell? {
        guard let msg = messageIndex[id] else { return nil }
        let cell = cv.dequeueReusableCell(withReuseIdentifier: MessageCell.reuseID, for: ip) as? MessageCell
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
        // Long press — контекстное меню с per-message actions
        cell?.onLongPress = { [weak self] message, sourceView in
            guard let self, !message.actions.isEmpty else { return }
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            freezeCollectionBottomInset()
            inputBar.textView.resignFirstResponder()
            showContextMenu(for: message, sourceView: sourceView)
        }
        // Wire content view callbacks for video/poll/file
        if let bubbleView = cell?.bubbleView {
            wireContentCallbacks(bubbleView: bubbleView, message: msg)
        }
        return cell
    }
}

// MARK: - Content view callbacks (video / poll / file)

extension ChatViewController {

    func wireContentCallbacks(bubbleView: MessageBubbleView, message: ChatMessage) {
        // Video tap — tap on the entire video content view triggers delegate
        if let videoView = bubbleView.contentView as? VideoContentView {
            let tapGR = videoView.gestureRecognizers?.first(where: { $0 is UITapGestureRecognizer })
            if tapGR == nil {
                let tap = UITapGestureRecognizer(target: self, action: nil)
                tap.cancelsTouchesInView = false
                videoView.addGestureRecognizer(tap)
            }
            // Use a closure-based approach via property
            if let url = message.content.video?.url {
                let msgCopy = message
                videoView.isUserInteractionEnabled = true
                // Remove old targets
                videoView.gestureRecognizers?.forEach { videoView.removeGestureRecognizer($0) }
                let tap = BlockTapGestureRecognizer { [weak self] in
                    guard let self else { return }
                    self.delegate?.chatViewController(self, didTapVideo: url, for: msgCopy)
                }
                videoView.addGestureRecognizer(tap)
            }
        } else if let mixedVideoView = bubbleView.contentView as? MixedTextVideoContentView {
            if let url = message.content.video?.url {
                let msgCopy = message
                mixedVideoView.isUserInteractionEnabled = true
                mixedVideoView.gestureRecognizers?.forEach { mixedVideoView.removeGestureRecognizer($0) }
                let tap = BlockTapGestureRecognizer { [weak self] in
                    guard let self else { return }
                    self.delegate?.chatViewController(self, didTapVideo: url, for: msgCopy)
                }
                mixedVideoView.addGestureRecognizer(tap)
            }
        }

        // Poll option tap
        if let pollView = bubbleView.contentView as? PollContentView {
            let msgCopy = message
            pollView.onOptionTap = { [weak self] pollId, optionId in
                guard let self else { return }
                self.delegate?.chatViewController(self, didTapPollOption: optionId, pollId: pollId, for: msgCopy)
            }
        }

        // File tap
        if let fileView = bubbleView.contentView as? FileContentView {
            let msgCopy = message
            fileView.onFileTap = { [weak self] fileUrl, fileName in
                guard let self else { return }
                self.delegate?.chatViewController(self, didTapFile: fileUrl, fileName: fileName, for: msgCopy)
            }
        }
    }
}

/// Простой tap gesture recognizer с замыканием.
private final class BlockTapGestureRecognizer: UITapGestureRecognizer {
    private let action: () -> Void

    init(action: @escaping () -> Void) {
        self.action = action
        super.init(target: nil, action: nil)
        addTarget(self, action: #selector(handleTap))
    }

    @objc private func handleTap() { action() }
}

// MARK: - Секции и snapshot

extension ChatViewController {

    /// Группирует сообщения по дате.
    /// Пропускает пересчёт если хэш входных данных не изменился.
    /// Использует Hasher для order-sensitive, collision-resistant хэширования.
    /// Включает isEdited — чтобы правки сообщений корректно триггерили обновление.
    func buildSections(from messages: [ChatMessage]) -> [MessageSection] {
        var hasher = Hasher()
        messages.forEach {
            hasher.combine($0.id)
            hasher.combine($0.status.rawValue)
            hasher.combine($0.groupDate)
            hasher.combine($0.isEdited)
        }
        let newHash = hasher.finalize()
        guard newHash != lastSectionsInputHash || sections.isEmpty else { return sections }
        lastSectionsInputHash = newHash

        // Оптимизация: проверяем отсортированность перед sort — O(n) vs O(n log n).
        // JS/RN обычно присылает сообщения уже отсортированными по timestamp.
        let sorted: [ChatMessage]
        if messages.isEmpty || zip(messages, messages.dropFirst()).allSatisfy({ $0.0.timestamp <= $0.1.timestamp }) {
            sorted = messages
        } else {
            sorted = messages.sorted { $0.timestamp < $1.timestamp }
        }

        var map:   [String: MessageSection] = [:]
        var order: [String] = []
        for msg in sorted {
            if map[msg.groupDate] == nil {
                map[msg.groupDate] = MessageSection(dateKey: msg.groupDate, messages: [])
                order.append(msg.groupDate)
            }
            map[msg.groupDate]?.messages.append(msg)
        }
        let result = order.compactMap { map[$0] }

        // Перестроить O(1)-индекс IndexPath для scrollToMessage/highlightMessage.
        rebuildIndexPathIndex(from: result)

        return result
    }

    func buildSnapshot() -> NSDiffableDataSourceSnapshot<String, String> {
        var snap = NSDiffableDataSourceSnapshot<String, String>()
        for section in sections {
            snap.appendSections([section.dateKey])
            snap.appendItems(section.messages.map(\.id), toSection: section.dateKey)
        }
        return snap
    }

    /// Определяет, являются ли новые данные prepend-загрузкой истории (сообщения добавлены в начало).
    func isPrepend(newSections: [MessageSection]) -> Bool {
        guard let oldestTimestamp = sections.first?.messages.first?.timestamp else { return false }
        let allTimestamps = newSections.flatMap { $0.messages.map(\.timestamp) }
        let addedCount    = allTimestamps.count - lastKnownMessageCount
        guard addedCount > 0 else { return false }
        return allTimestamps.prefix(addedCount).allSatisfy { $0 < oldestTimestamp }
    }
}

// MARK: - IndexPath-индекс (O(1) поиск по id)

extension ChatViewController {

    /// Перестраивает словарь id → IndexPath после каждого пересчёта секций.
    func rebuildIndexPathIndex(from sections: [MessageSection]) {
        var index: [String: IndexPath] = [:]
        index.reserveCapacity(sections.reduce(0) { $0 + $1.messages.count })
        for (si, section) in sections.enumerated() {
            for (ii, msg) in section.messages.enumerated() {
                index[msg.id] = IndexPath(item: ii, section: si)
            }
        }
        indexPathIndex = index
    }

    /// O(1) поиск IndexPath по id сообщения.
    func indexPath(forMessageID id: String) -> IndexPath? {
        indexPathIndex[id]
    }
}

// MARK: - Кэш размеров и вспомогательные методы

extension ChatViewController {

    /// Прогревает кэш размеров ячеек в фоновом потоке.
    /// Снапшот messageIndex берётся на main thread, чтобы избежать гонки данных.
    func warmCache(for messages: [ChatMessage], width: CGFloat) {
        guard width > 0 else { return }
        let uncached = messages.filter { !sizeCache.contains($0.id) }
        guard !uncached.isEmpty else { return }

        // Снапшот index на текущий момент — безопасно передаётся в background.
        let indexSnapshot = messageIndex
        let hasReplyMap = Dictionary(uniqueKeysWithValues: uncached.map { msg in
            (msg.id, indexSnapshot[msg.reply?.replyToId ?? ""] != nil)
        })

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self else { return }
            sizeCache.prefill(messages: uncached, hasReplyMap: hasReplyMap, collectionViewWidth: width)
        }
    }

    func resolveReply(for message: ChatMessage) -> ResolvedReply? {
        guard let reply = message.reply else { return nil }
        return messageIndex[reply.replyToId].map { .found(ReplyDisplayInfo(from: $0)) } ?? .deleted
    }

    func replyExists(for message: ChatMessage) -> Bool {
        guard let id = message.reply?.replyToId else { return false }
        return messageIndex[id] != nil
    }
}

// MARK: - Дебаунс видимости входящих сообщений

extension ChatViewController {

    /// Накапливает id видимых входящих сообщений и отправляет пачкой делегату после паузы скролла.
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

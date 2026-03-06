// MARK: - MessageSizeCache.swift
// Thread-safe кэш размеров ячеек.
// Использует readers-writer lock: concurrent read, barrier write.
// Ключ = (messageId, hasReply) — оба варианта инвалидируются при изменении.

import UIKit

final class MessageSizeCache {

    // MARK: - Key

    private struct Key: Hashable {
        let id:       String
        let hasReply: Bool
    }

    // MARK: - Storage

    private let lock  = DispatchQueue(label: "com.chat.sizeCache", attributes: .concurrent)
    private var cache: [Key: CGSize] = [:]
    private var _layoutWidth: CGFloat = 0

    // MARK: - Public API

    /// Актуальная ширина layout, при которой был рассчитан кэш.
    private(set) var layoutWidth: CGFloat {
        get { lock.sync { _layoutWidth } }
        set { lock.sync(flags: .barrier) { _layoutWidth = newValue } }
    }

    /// Возвращает закэшированный или вычисляет новый размер ячейки.
    /// При смене ширины layout весь кэш инвалидируется автоматически.
    func size(
        for message: ChatMessage,
        hasReply: Bool,
        collectionViewWidth: CGFloat
    ) -> CGSize {
        let key = Key(id: message.id, hasReply: hasReply)

        // Один barrier-блок: проверяем ширину И читаем кэш — 1 lock вместо 2.
        let cached: CGSize? = lock.sync(flags: .barrier) {
            if collectionViewWidth != _layoutWidth {
                cache.removeAll()
                _layoutWidth = collectionViewWidth
            }
            return cache[key]
        }

        if let hit = cached { return hit }

        // Cache miss: вычисление вне лока (CPU-bound, не мутирует cache).
        let size = MessageSizeCalculator.cellSize(
            for: message,
            hasReply: hasReply,
            collectionViewWidth: collectionViewWidth
        )
        lock.sync(flags: .barrier) { cache[key] = size }
        return size
    }

    /// Прогрев кэша из фонового потока — устраняет hitches при первом показе
    /// и после prepend (подгрузки истории сверху).
    func prefill(
        messages: [ChatMessage],
        hasReplyMap: [String: Bool],
        collectionViewWidth: CGFloat
    ) {
        for msg in messages {
            let hasReply = hasReplyMap[msg.id] ?? false
            let key      = Key(id: msg.id, hasReply: hasReply)

            // Проверяем наличие одним barrier-блоком (одновременная проверка + условная запись).
            lock.sync(flags: .barrier) {
                guard cache[key] == nil else { return }
                // Вычисляем внутри barrier — допустимо, так как это фоновый поток prefill.
                let size = MessageSizeCalculator.cellSize(
                    for: msg,
                    hasReply: hasReply,
                    collectionViewWidth: collectionViewWidth
                )
                cache[key] = size
            }
        }
    }

    /// Инвалидирует оба варианта ключа (с цитатой и без) для каждого ID.
    func invalidate(ids: some Collection<String>) {
        lock.sync(flags: .barrier) {
            for id in ids {
                cache.removeValue(forKey: Key(id: id, hasReply: false))
                cache.removeValue(forKey: Key(id: id, hasReply: true))
            }
        }
    }

    /// Полная инвалидация — например, при смене ширины экрана.
    func invalidateAll() {
        lock.sync(flags: .barrier) { cache.removeAll() }
    }

    /// Проверяет наличие хотя бы одного варианта ключа для данного ID.
    func contains(_ id: String) -> Bool {
        lock.sync {
            cache[Key(id: id, hasReply: false)] != nil ||
            cache[Key(id: id, hasReply: true)]  != nil
        }
    }
}

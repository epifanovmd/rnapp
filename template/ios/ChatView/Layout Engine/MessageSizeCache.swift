// MARK: - MessageSizeCache.swift
// Dictionary-кэш размеров ячеек.
// Ключ: (messageId, hasReply) — наличие/отсутствие живой цитаты меняет высоту.
// Когда оригинал цитаты удаляется, hasReply становится false → кэш-мисс → пересчёт.

import UIKit

final class MessageSizeCache {

    private struct Key: Hashable {
        let id:       String
        let hasReply: Bool
    }

    private var cache: [Key: CGSize] = [:]
    private(set) var layoutWidth: CGFloat = 0

    // MARK: - API

    func size(for message: ChatMessage,
              hasReply: Bool,
              collectionViewWidth: CGFloat) -> CGSize {
        if collectionViewWidth != layoutWidth {
            cache.removeAll()
            layoutWidth = collectionViewWidth
        }
        let key = Key(id: message.id, hasReply: hasReply)
        if let hit = cache[key] { return hit }
        let size = MessageSizeCalculator.cellSize(for: message, hasReply: hasReply,
                                                  collectionViewWidth: collectionViewWidth)
        cache[key] = size
        return size
    }

    /// Инвалидирует оба варианта ключа (с цитатой и без) для каждого ID.
    func invalidate(ids: some Collection<String>) {
        for id in ids {
            cache.removeValue(forKey: Key(id: id, hasReply: false))
            cache.removeValue(forKey: Key(id: id, hasReply: true))
        }
    }

    func invalidateAll() { cache.removeAll() }
}

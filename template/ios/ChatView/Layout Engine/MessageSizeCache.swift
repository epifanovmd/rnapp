// MARK: - MessageSizeCache.swift
// Dictionary-кэш размеров ячеек.
// Ключ: (messageId, hasReply) — наличие/отсутствие живой цитаты меняет высоту.
// Когда оригинал цитаты удаляется, hasReply становится false → кэш-мисс → пересчёт.
//
// Fix #4: Thread-safety.
//   • Кэш может прогреваться из фонового потока (ChatViewController.warmCache).
//   • Все операции чтения/записи защищены concurrent DispatchQueue с barrier-записью
//     (readers-writer lock): множественные читатели работают параллельно,
//     запись эксклюзивна.

import UIKit

final class MessageSizeCache {

    private struct Key: Hashable {
        let id:       String
        let hasReply: Bool
    }

    // Readers-writer lock: concurrent queue + barrier для записи
    private let lock = DispatchQueue(label: "com.chat.sizeCache", attributes: .concurrent)
    private var cache: [Key: CGSize] = [:]
    private var _layoutWidth: CGFloat = 0

    // MARK: - Public API

    private(set) var layoutWidth: CGFloat {
        get { lock.sync { _layoutWidth } }
        set { lock.sync(flags: .barrier) { _layoutWidth = newValue } }
    }

    func size(for message: ChatMessage,
              hasReply: Bool,
              collectionViewWidth: CGFloat) -> CGSize {
        // Если ширина изменилась — инвалидируем весь кэш (barrier)
        lock.sync(flags: .barrier) {
            if collectionViewWidth != _layoutWidth {
                cache.removeAll()
                _layoutWidth = collectionViewWidth
            }
        }

        let key = Key(id: message.id, hasReply: hasReply)

        // Быстрое чтение (concurrent)
        if let hit = lock.sync(execute: { cache[key] }) { return hit }

        // Кэш-мисс: вычисляем вне лока (CPU-bound, не мутирует кэш)
        let size = MessageSizeCalculator.cellSize(for: message, hasReply: hasReply,
                                                  collectionViewWidth: collectionViewWidth)
        // Сохраняем (barrier)
        lock.sync(flags: .barrier) { cache[key] = size }
        return size
    }

    /// Прогрев кэша для набора сообщений — вызывается из фонового потока.
    /// Позволяет избежать вычисления NSString.boundingRect на main thread
    /// во время sizeForItemAt при первом показе или после prepend.
    func prefill(messages: [ChatMessage],
                 hasReplyMap: [String: Bool],
                 collectionViewWidth: CGFloat) {
        for msg in messages {
            let hasReply = hasReplyMap[msg.id] ?? false
            let key = Key(id: msg.id, hasReply: hasReply)
            // Пропускаем уже кэшированные
            guard lock.sync(execute: { cache[key] }) == nil else { continue }
            let size = MessageSizeCalculator.cellSize(for: msg, hasReply: hasReply,
                                                      collectionViewWidth: collectionViewWidth)
            lock.sync(flags: .barrier) { cache[key] = size }
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

    func invalidateAll() {
        lock.sync(flags: .barrier) { cache.removeAll() }
    }

    /// Проверяет наличие кэша для данного ID (любой вариант hasReply).
    func contains(_ id: String) -> Bool {
        lock.sync {
            cache[Key(id: id, hasReply: false)] != nil ||
            cache[Key(id: id, hasReply: true)]  != nil
        }
    }
}

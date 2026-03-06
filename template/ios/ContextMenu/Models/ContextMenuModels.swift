// MARK: - ContextMenuModels.swift
// Доменные модели для кастомного контекстного меню.
// Автономны — не зависят от ChatModels или любых других модулей.

import UIKit

// MARK: - ContextMenuAction

/// Одно действие в меню (аналог UIAction).
public struct ContextMenuAction {
    public let id: String
    public let title: String
    public let systemImage: String?
    public let isDestructive: Bool

    public init(id: String, title: String, systemImage: String? = nil, isDestructive: Bool = false) {
        self.id            = id
        self.title         = title
        self.systemImage   = systemImage
        self.isDestructive = isDestructive
    }
}

// MARK: - ContextMenuEmoji

/// Один элемент emoji-панели.
public struct ContextMenuEmoji {
    public let emoji: String

    public init(emoji: String) {
        self.emoji = emoji
    }
}

// MARK: - ContextMenuConfiguration

/// Полная конфигурация одного вызова контекстного меню.
public struct ContextMenuConfiguration {
    /// Уникальный идентификатор (используется для callbacks).
    public let id: String
    /// View, на котором произошло долгое нажатие — будет показан как preview.
    public let sourceView: UIView
    /// Emoji-панель сверху.
    public let emojis: [ContextMenuEmoji]
    /// Действия в меню снизу.
    public let actions: [ContextMenuAction]

    public init(
        id: String,
        sourceView: UIView,
        emojis: [ContextMenuEmoji],
        actions: [ContextMenuAction]
    ) {
        self.id         = id
        self.sourceView = sourceView
        self.emojis     = emojis
        self.actions    = actions
    }
}

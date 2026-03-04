// MARK: - MessageContentViews.swift
//
// Протокол MessageContentView и фабрика MessageContentViewFactory.
// Конкретные реализации вынесены в отдельные файлы:
//   • TextContentView.swift
//   • ImagesContentView.swift
//   • MixedContentView.swift
//
// Добавление нового типа сообщения:
//   1. Создать NewTypeContentView.swift реализующий MessageContentView
//   2. Добавить case в factory make() и matches()
//   3. Добавить case в MessageSizeCalculator.contentHeight(for:bubbleWidth:)
//   Всё остальное (Cell, BubbleView, Cache, DataSource) — не трогать.

import UIKit

// MARK: - Protocol

protocol MessageContentView: UIView {
    /// Настраивает данные и цвета. Вызывается при каждом configure ячейки.
    func configure(content: MessageContent, isMine: Bool)
    /// Применяет layout-зависимые вычисления после установки точной ширины пузыря.
    func applyLayout(bubbleWidth: CGFloat)
    /// Отменяет асинхронные операции (загрузка изображений). Вызывается в prepareForReuse.
    func cancelAsync()
}

extension MessageContentView {
    func cancelAsync() {}   // default no-op для текстовых типов
}

// MARK: - Factory

enum MessageContentViewFactory {

    static func make(for content: MessageContent) -> any MessageContentView {
        switch content {
        case .text:   return TextContentView()
        case .images: return ImagesContentView()
        case .mixed:  return MixedContentView()
        }
    }

    /// true → текущий view соответствует типу контента, пересоздавать не нужно.
    static func matches(_ view: (any MessageContentView)?, content: MessageContent) -> Bool {
        guard let view else { return false }
        switch content {
        case .text:   return view is TextContentView
        case .images: return view is ImagesContentView
        case .mixed:  return view is MixedContentView
        }
    }
}

// MARK: - MessageCell+ContextMenu.swift
// Расширение MessageCell — предоставляет view для снапшота контекстного меню.
// Отдаёт bubbleView как sourceView для ContextMenuViewController.

import UIKit

extension MessageCell {

    /// View пузыря — используется как sourceView для кастомного контекстного меню.
    /// ContextMenuViewController сделает снапшот этого view.
    var bubbleSnapshotView: UIView {
        // bubbleView — private, но мы обращаемся к нему через contentView subviews
        // MessageBubbleView всегда первый subview contentView
        return contentView.subviews.first ?? contentView
    }
}

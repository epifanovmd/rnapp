// MARK: - RNContextMenuView.swift
// React Native bridge для кастомного контекстного меню.
// Самостоятельный компонент — не зависит от ChatView.
// Оборачивает любой дочерний RN View и добавляет к нему long-press контекстное меню.

import UIKit
import React

// MARK: - RNContextMenuView

@objc final class RNContextMenuView: UIView {

    // MARK: - Events

    @objc var onEmojiSelect:  RCTDirectEventBlock?
    @objc var onActionSelect: RCTDirectEventBlock?
    @objc var onDismiss:      RCTDirectEventBlock?
    @objc var onWillShow:     RCTDirectEventBlock?

    // MARK: - Props

    /// Список эмодзи: [{ "emoji": "❤️" }, ...]
    @objc var emojis: NSArray = [] {
        didSet { rebuildConfiguration() }
    }

    /// Список действий: [{ "id": "reply", "title": "Reply", "systemImage": "arrowshape.turn.up.left", "isDestructive": false }]
    @objc var actions: NSArray = [] {
        didSet { rebuildConfiguration() }
    }

    /// Уникальный идентификатор (прокидывается обратно в колбэки)
    @objc var menuId: NSString = "" {
        didSet { rebuildConfiguration() }
    }

    /// Тема: "light" | "dark"
    @objc var menuTheme: NSString = "light" {
        didSet { updateTheme() }
    }

    /// Минимальное время нажатия для активации (секунды)
    @objc var minimumPressDuration: NSNumber = 0.35 {
        didSet { longPressGR.minimumPressDuration = minimumPressDuration.doubleValue }
    }

    // MARK: - Private state

    private var parsedEmojis:   [ContextMenuEmoji]  = []
    private var parsedActions:  [ContextMenuAction] = []
    private var currentTheme:   ContextMenuTheme    = .light

    private lazy var longPressGR: UILongPressGestureRecognizer = {
        let gr = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress(_:)))
        gr.minimumPressDuration = 0.35
        gr.cancelsTouchesInView = false
        return gr
    }()

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        addGestureRecognizer(longPressGR)
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        addGestureRecognizer(longPressGR)
    }

    // MARK: - Long press

    @objc private func handleLongPress(_ gr: UILongPressGestureRecognizer) {
        guard gr.state == .began else { return }
        showMenu()
    }

    // MARK: - Show

    private func showMenu() {
        guard !parsedEmojis.isEmpty || !parsedActions.isEmpty else { return }
        guard let vc = findParentViewController() else { return }

        onWillShow?(["menuId": menuId as String])

        // Используем self как sourceView для снапшота
        let config = ContextMenuConfiguration(
            id:         menuId as String,
            sourceView: self,
            emojis:     parsedEmojis,
            actions:    parsedActions
        )

        // Haptic feedback
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()

        ContextMenuViewController.present(
            configuration: config,
            theme:         currentTheme,
            from:          vc,
            delegate:      self
        )
    }

    // MARK: - Prop parsing

    private func rebuildConfiguration() {
        parsedEmojis = (emojis as? [[String: Any]] ?? []).compactMap { dict in
            guard let emoji = dict["emoji"] as? String else { return nil }
            return ContextMenuEmoji(emoji: emoji)
        }

        parsedActions = (actions as? [[String: Any]] ?? []).compactMap { dict in
            guard let id    = dict["id"] as? String,
                  let title = dict["title"] as? String else { return nil }
            return ContextMenuAction(
                id:            id,
                title:         title,
                systemImage:   dict["systemImage"] as? String,
                isDestructive: dict["isDestructive"] as? Bool ?? false
            )
        }
    }

    private func updateTheme() {
        currentTheme = (menuTheme as String).lowercased() == "dark" ? .dark : .light
    }

    // MARK: - Helpers

    private func findParentViewController() -> UIViewController? {
        var responder: UIResponder? = self
        while let r = responder {
            if let vc = r as? UIViewController { return vc }
            responder = r.next
        }
        return nil
    }
}

// MARK: - ContextMenuDelegate

extension RNContextMenuView: ContextMenuDelegate {

    func contextMenu(_ menu: ContextMenuViewController, didSelectEmoji emoji: String, forId id: String) {
        onEmojiSelect?(["emoji": emoji, "menuId": id])
    }

    func contextMenu(_ menu: ContextMenuViewController, didSelectAction action: ContextMenuAction, forId id: String) {
        onActionSelect?(["actionId": action.id, "menuId": id])
    }

    func contextMenuDidDismiss(_ menu: ContextMenuViewController, id: String) {
        onDismiss?(["menuId": id])
    }
}

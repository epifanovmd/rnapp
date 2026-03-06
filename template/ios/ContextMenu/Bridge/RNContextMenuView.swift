// MARK: - RNContextMenuView.swift
// React Native bridge для кастомного контекстного меню.
// Формат пропов приведён к стилю RNChatView:
//   - emojis: [String]            (было: [{ "emoji": "❤️" }])
//   - actions: [{ id, title, … }] (без изменений)
//   - theme: "light" | "dark"     (было: menuTheme)
// Исправлен баг: после анимации закрытия VC теперь вызывает dismiss,
// чтобы не блокировать касания.

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

    /// Уникальный идентификатор (прокидывается обратно в колбэки)
    @objc var menuId: NSString = "" {
        didSet { /* используется напрямую в showMenu */ }
    }

    /// Список эмодзи: ["❤️", "👍", "😂"]  — как emojiReactions в чате
    @objc var emojis: NSArray = [] {
        didSet { rebuildEmojis() }
    }

    /// Список действий: [{ "id": "reply", "title": "Reply", "systemImage": "…", "isDestructive": false }]
    @objc var actions: NSArray = [] {
        didSet { rebuildActions() }
    }

    /// Тема: "light" | "dark"  — как theme в чате
    @objc var theme: NSString = "light" {
        didSet { currentTheme = (theme as String).lowercased() == "dark" ? .dark : .light }
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
        gr.minimumPressDuration  = 0.35
        gr.cancelsTouchesInView  = false
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

        UIImpactFeedbackGenerator(style: .medium).impactOccurred()

        let config = ContextMenuConfiguration(
            id:         menuId as String,
            sourceView: self,
            emojis:     parsedEmojis,
            actions:    parsedActions
        )

        ContextMenuViewController.present(
            configuration: config,
            theme:         currentTheme,
            from:          vc,
            delegate:      self
        )
    }

    // MARK: - Prop parsing

    /// Принимает массив строк ["❤️", "👍"]
    private func rebuildEmojis() {
        parsedEmojis = (emojis as? [String] ?? []).map { ContextMenuEmoji(emoji: $0) }
    }

    private func rebuildActions() {
        parsedActions = (actions as? [[String: Any]] ?? []).compactMap { dict in
            guard let id    = dict["id"]    as? String,
                  let title = dict["title"] as? String else { return nil }
            return ContextMenuAction(
                id:            id,
                title:         title,
                systemImage:   dict["systemImage"]   as? String,
                isDestructive: dict["isDestructive"] as? Bool ?? false
            )
        }
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

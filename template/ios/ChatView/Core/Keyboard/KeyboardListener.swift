// MARK: - KeyboardListener.swift

import Foundation
import UIKit

final class KeyboardListener {

    static let shared = KeyboardListener()

    private(set) var isKeyboardVisible: Bool = false
    private(set) var keyboardRect:      CGRect?

    private var delegates = NSHashTable<AnyObject>.weakObjects()

    func add(delegate: KeyboardListenerDelegate) {
        delegates.add(delegate)
    }

    private init() {
        subscribeToKeyboardNotifications()
    }

    // MARK: - Convenience

    /// Возвращает живых делегатов без повторного compactMap в каждом обработчике.
    private var activeDelegates: [KeyboardListenerDelegate] {
        delegates.allObjects.compactMap { $0 as? KeyboardListenerDelegate }
    }

    // MARK: - Handlers

    @objc private func keyboardWillShow(_ notification: Notification) {
        guard let info = KeyboardInfo(notification) else { return }
        keyboardRect      = info.frameEnd
        isKeyboardVisible = true
        activeDelegates.forEach { $0.keyboardWillShow(info: info) }
    }

    @objc private func keyboardWillChangeFrame(_ notification: Notification) {
        guard let info = KeyboardInfo(notification) else { return }
        keyboardRect = info.frameEnd
        activeDelegates.forEach { $0.keyboardWillChangeFrame(info: info) }
    }

    @objc private func keyboardDidChangeFrame(_ notification: Notification) {
        guard let info = KeyboardInfo(notification) else { return }
        keyboardRect = info.frameEnd
        activeDelegates.forEach { $0.keyboardDidChangeFrame(info: info) }
    }

    @objc private func keyboardDidShow(_ notification: Notification) {
        guard let info = KeyboardInfo(notification) else { return }
        keyboardRect = info.frameEnd
        activeDelegates.forEach { $0.keyboardDidShow(info: info) }
    }

    @objc private func keyboardWillHide(_ notification: Notification) {
        guard let info = KeyboardInfo(notification) else { return }
        keyboardRect = info.frameEnd
        activeDelegates.forEach { $0.keyboardWillHide(info: info) }
    }

    @objc private func keyboardDidHide(_ notification: Notification) {
        guard let info = KeyboardInfo(notification) else { return }
        keyboardRect      = info.frameEnd
        isKeyboardVisible = false
        activeDelegates.forEach { $0.keyboardDidHide(info: info) }
    }

    // MARK: - Subscriptions

    private func subscribeToKeyboardNotifications() {
        let pairs: [(Selector, NSNotification.Name)] = [
            (#selector(keyboardWillShow(_:)),        UIResponder.keyboardWillShowNotification),
            (#selector(keyboardDidShow(_:)),         UIResponder.keyboardDidShowNotification),
            (#selector(keyboardWillHide(_:)),        UIResponder.keyboardWillHideNotification),
            (#selector(keyboardDidHide(_:)),         UIResponder.keyboardDidHideNotification),
            (#selector(keyboardWillChangeFrame(_:)), UIResponder.keyboardWillChangeFrameNotification),
            (#selector(keyboardDidChangeFrame(_:)),  UIResponder.keyboardDidChangeFrameNotification),
        ]
        pairs.forEach { selector, name in
            NotificationCenter.default.addObserver(self, selector: selector, name: name, object: nil)
        }
    }
}

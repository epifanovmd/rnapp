// MARK: - ChatViewController+KeyboardFreeze.swift
//
// Логика заморозки/разморозки bottomInset коллекции на время показа контекстного меню.

import UIKit

extension ChatViewController {

    // MARK: - Freeze

    /// Фиксирует текущий bottomInset и подписывается на WillHide.
    /// Вызывать СИНХРОННО до resignFirstResponder.
    func freezeCollectionBottomInset() {
        guard !isInsetFrozen else { return }

        keyboardWasVisible = inputBar.textView.isFirstResponder
        isInsetFrozen      = true
        frozenBottomInset  = collectionView.contentInset.bottom

        kbHideObserver = NotificationCenter.default.addObserver(
            forName: UIResponder.keyboardWillHideNotification,
            object: nil, queue: .main
        ) { [weak self] note in
            self?.handleKeyboardWillHide(note)
        }
    }

    // MARK: - WillHide intercept

    private func handleKeyboardWillHide(_ note: Notification) {
        guard isInsetFrozen, let frozen = frozenBottomInset else { return }
        let duration = (note.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double) ?? 0.25
        let curveRaw = (note.userInfo?[UIResponder.keyboardAnimationCurveUserInfoKey] as? Int) ?? 7
        let options  = UIView.AnimationOptions(rawValue: UInt(curveRaw) << 16).union(.beginFromCurrentState)
        UIView.animate(withDuration: duration, delay: 0, options: options) { [weak self] in
            guard let self else { return }
            self.collectionView.contentInset.bottom                  = frozen
            self.collectionView.verticalScrollIndicatorInsets.bottom = frozen
        }
    }

    // MARK: - Restore

    /// Восстанавливает нормальное поведение inset после закрытия контекстного меню.
    /// Вызывать из ContextMenuDelegate-методов — к этому моменту меню уже снято с экрана.
    func restoreCollectionBottomInset() {
        removeKbHideObserver()

        let wasVisible     = keyboardWasVisible
        keyboardWasVisible = false

        guard isInsetFrozen else { return }

        if wasVisible {
            // Клавиатура была открыта — возвращаем фокус и размораживаем после её появления.
            kbShowObserver = NotificationCenter.default.addObserver(
                forName: UIResponder.keyboardDidShowNotification,
                object: nil, queue: .main
            ) { [weak self] _ in
                self?.removeKbShowObserver()
                self?.thaw()
            }
            inputBar.textView.becomeFirstResponder()
        } else {
            // Клавиатуры не было — размораживаем сразу.
            thaw()
        }
    }

    // MARK: - Thaw

    func thaw() {
        isInsetFrozen     = false
        frozenBottomInset = nil
        updateCollectionBottomInset()
    }

    // MARK: - Observer cleanup

    private func removeKbHideObserver() {
        guard let token = kbHideObserver else { return }
        NotificationCenter.default.removeObserver(token)
        kbHideObserver = nil
    }

    private func removeKbShowObserver() {
        guard let token = kbShowObserver else { return }
        NotificationCenter.default.removeObserver(token)
        kbShowObserver = nil
    }
}

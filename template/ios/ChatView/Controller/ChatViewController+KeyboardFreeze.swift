// MARK: - ChatViewController+KeyboardFreeze.swift
//
// Задача: при открытии контекстного меню клавиатура скрывается,
// при закрытии — возвращается. Коллекция должна оставаться неподвижной.
//
// ПОТОК:
//   1. handleBubbleLongPress:
//        freezeCollectionBottomInset()   ← isInsetFrozen = true СИНХРОННО
//        resignFirstResponder()          ← UIKit кидает WillHide, observer держит inset
//        present(menuVC)
//
//   2. ContextMenuDelegate callback (меню уже снято с экрана к этому моменту):
//        restoreCollectionBottomInset()
//        → если клавиатура была открыта: becomeFirstResponder → ждём keyboardDidShow → thaw()
//        → если клавиатуры не было:      thaw() сразу

import UIKit

private var frozenInsetKey:    UInt8 = 0
private var isFrozenKey:       UInt8 = 1
private var kbHideObserverKey: UInt8 = 2
private var kbShowObserverKey: UInt8 = 3
private var kbWasVisibleKey:   UInt8 = 4
private var emojiReactionsKey: UInt8 = 5

extension ChatViewController {

    // MARK: - Stored properties

    var frozenBottomInset: CGFloat? {
        get { objc_getAssociatedObject(self, &frozenInsetKey) as? CGFloat }
        set { objc_setAssociatedObject(self, &frozenInsetKey, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC) }
    }

    var isInsetFrozen: Bool {
        get { objc_getAssociatedObject(self, &isFrozenKey) as? Bool ?? false }
        set { objc_setAssociatedObject(self, &isFrozenKey, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC) }
    }

    var keyboardWasVisible: Bool {
        get { objc_getAssociatedObject(self, &kbWasVisibleKey) as? Bool ?? false }
        set { objc_setAssociatedObject(self, &kbWasVisibleKey, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC) }
    }

    var contextMenuEmojis: [ContextMenuEmoji] {
        get { objc_getAssociatedObject(self, &emojiReactionsKey) as? [ContextMenuEmoji] ?? [] }
        set { objc_setAssociatedObject(self, &emojiReactionsKey, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC) }
    }

    // MARK: - Freeze
    // Вызывать СИНХРОННО и ПЕРВЫМ, до resignFirstResponder.

    func freezeCollectionBottomInset() {
        guard !isInsetFrozen else { return }

        keyboardWasVisible = inputBar.textView.isFirstResponder
        isInsetFrozen      = true
        frozenBottomInset  = collectionView.contentInset.bottom

        let token = NotificationCenter.default.addObserver(
            forName: UIResponder.keyboardWillHideNotification,
            object: nil, queue: .main
        ) { [weak self] note in
            self?.handleKeyboardWillHide(note)
        }
        objc_setAssociatedObject(self, &kbHideObserverKey, token, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
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
    //
    // Вызывается из ContextMenuDelegate-методов ПОСЛЕ того как меню уже снято с экрана
    // (ContextMenuViewController сам вызывает dismiss внутри close()).
    // becomeFirstResponder() безопасен — presented VC больше не блокирует фокус.

    func restoreCollectionBottomInset() {
        removeKbHideObserver()

        let wasVisible     = keyboardWasVisible
        keyboardWasVisible = false

        guard isInsetFrozen else { return }

        if wasVisible {
            // Клавиатура была открыта — возвращаем фокус и ждём keyboardDidShow для thaw.
            let token = NotificationCenter.default.addObserver(
                forName: UIResponder.keyboardDidShowNotification,
                object: nil, queue: .main
            ) { [weak self] _ in
                guard let self else { return }
                self.removeKbShowObserver()
                self.thaw()
            }
            objc_setAssociatedObject(self, &kbShowObserverKey, token, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
            inputBar.textView.becomeFirstResponder()
        } else {
            // Клавиатуры не было — размораживаем сразу, inset должен вернуться
            // к нормальному (без клавиатуры) значению через updateCollectionBottomInset.
            thaw()
        }
    }

    // MARK: - Private helpers

    func thaw() {
        isInsetFrozen     = false
        frozenBottomInset = nil
        updateCollectionBottomInset()
    }

    private func removeKbHideObserver() {
        if let token = objc_getAssociatedObject(self, &kbHideObserverKey) {
            NotificationCenter.default.removeObserver(token)
            objc_setAssociatedObject(self, &kbHideObserverKey, nil, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        }
    }

    private func removeKbShowObserver() {
        if let token = objc_getAssociatedObject(self, &kbShowObserverKey) {
            NotificationCenter.default.removeObserver(token)
            objc_setAssociatedObject(self, &kbShowObserverKey, nil, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        }
    }
}

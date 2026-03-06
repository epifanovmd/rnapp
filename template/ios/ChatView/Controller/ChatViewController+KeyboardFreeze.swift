// MARK: - ChatViewController+KeyboardFreeze.swift
//
// Задача: при открытии контекстного меню клавиатура скрывается,
// при закрытии — возвращается. Коллекция должна оставаться неподвижной.
//
// Механизм:
//   freeze  → запоминаем inset, блокируем updateCollectionBottomInset,
//             перехватываем keyboardWillHide чтобы inset не упал
//   restore → возвращаем клавиатуру, держим inset замороженным
//             до keyboardDidShow (конец анимации подъёма),
//             только тогда разблокируем updateCollectionBottomInset

import UIKit

private var frozenInsetKey:    UInt8 = 0
private var isFrozenKey:       UInt8 = 1
private var kbObserversKey:    UInt8 = 2
private var kbWasVisibleKey:   UInt8 = 3
private var emojiReactionsKey: UInt8 = 4

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

    /// Вызывать ПЕРЕД resignFirstResponder.
    func freezeCollectionBottomInset() {
        guard !isInsetFrozen else { return }

        keyboardWasVisible = inputBar.textView.isFirstResponder
        isInsetFrozen      = true
        frozenBottomInset  = collectionView.contentInset.bottom

        // Перехватываем WillHide — не даём inset упасть пока меню открыто
        let hideToken = NotificationCenter.default.addObserver(
            forName: UIResponder.keyboardWillHideNotification,
            object: nil, queue: .main
        ) { [weak self] note in
            self?.onKeyboardWillHide(note)
        }

        objc_setAssociatedObject(self, &kbObserversKey, hideToken, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }

    // MARK: - Keyboard WillHide intercept

    private func onKeyboardWillHide(_ note: Notification) {
        guard isInsetFrozen, let frozen = frozenBottomInset else { return }

        let duration = (note.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double) ?? 0.25
        let curveVal = (note.userInfo?[UIResponder.keyboardAnimationCurveUserInfoKey] as? Int) ?? 7
        let options  = UIView.AnimationOptions(rawValue: UInt(curveVal) << 16)
            .union(.beginFromCurrentState)

        UIView.animate(withDuration: duration, delay: 0, options: options) {
            self.collectionView.contentInset.bottom                  = frozen
            self.collectionView.verticalScrollIndicatorInsets.bottom = frozen
        }
    }

    // MARK: - Restore

    /// Вызывать при закрытии контекстного меню (из delegate callbacks).
    func restoreCollectionBottomInset() {
        guard isInsetFrozen else { return }

        // Снимаем WillHide observer
        if let token = objc_getAssociatedObject(self, &kbObserversKey) {
            NotificationCenter.default.removeObserver(token)
            objc_setAssociatedObject(self, &kbObserversKey, nil, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        }

        if keyboardWasVisible {
            keyboardWasVisible = false
            // Подписываемся на DidShow — размораживаем только после завершения
            // анимации подъёма клавиатуры. Это устраняет прыжок.
            var showToken: NSObjectProtocol?
            showToken = NotificationCenter.default.addObserver(
                forName: UIResponder.keyboardDidShowNotification,
                object: nil, queue: .main
            ) { [weak self] _ in
                guard let self else { return }
                // Размораживаем
                self.isInsetFrozen    = false
                self.frozenBottomInset = nil
                // updateCollectionBottomInset теперь разблокирован —
                // вызываем вручную чтобы синхронизироваться с реальной позицией inputBar
                self.updateCollectionBottomInset()
                if let t = showToken {
                    NotificationCenter.default.removeObserver(t)
                }
            }

            // Поднимаем клавиатуру
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.02) { [weak self] in
                self?.inputBar.textView.becomeFirstResponder()
            }
            // isInsetFrozen остаётся true до keyboardDidShow
        } else {
            // Клавиатуры не было — сразу размораживаем
            isInsetFrozen     = false
            frozenBottomInset = nil
            updateCollectionBottomInset()
        }
    }
}

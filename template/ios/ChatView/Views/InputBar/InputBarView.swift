// MARK: - InputBarView.swift
// Нативная панель ввода: поле текста, кнопки вложения и отправки,
// панель цитаты (reply preview) и панель редактирования.

import UIKit

// MARK: - InputBarMode

/// Текущий режим ввода панели. Equatable для защиты от лишних перерисовок.
enum InputBarMode: Equatable {
    case normal
    case reply(ReplyInfo)
    case edit(messageId: String, originalText: String)

    static func == (lhs: InputBarMode, rhs: InputBarMode) -> Bool {
        switch (lhs, rhs) {
        case (.normal, .normal): return true
        case (.reply(let a), .reply(let b)): return a == b
        case (.edit(let id1, _), .edit(let id2, _)): return id1 == id2
        default: return false
        }
    }
}

// MARK: - InputBarDelegate

protocol InputBarDelegate: AnyObject {
    /// Пользователь отправил сообщение (normal / reply режим).
    func inputBar(_ bar: InputBarView, didSendText text: String, replyToId: String?)
    /// Пользователь подтвердил редактирование.
    func inputBar(_ bar: InputBarView, didEditText text: String, messageId: String)
    /// Пользователь отменил ответ крестиком.
    func inputBarDidCancelReply(_ bar: InputBarView)
    /// Пользователь отменил редактирование крестиком.
    func inputBarDidCancelEdit(_ bar: InputBarView)
    /// Высота панели изменилась — контроллер должен анимировать layout.
    func inputBar(_ bar: InputBarView, didChangeHeight height: CGFloat)
    /// Нажата кнопка вложения.
    func inputBarDidTapAttachment(_ bar: InputBarView)
}

// Необязательные методы
extension InputBarDelegate {
    func inputBar(_ bar: InputBarView, didEditText text: String, messageId: String) {}
    func inputBarDidCancelReply(_ bar: InputBarView) {}
    func inputBarDidCancelEdit(_ bar: InputBarView) {}
}

// MARK: - InputBarView

final class InputBarView: UIView {

    // MARK: - Public

    weak var delegate: InputBarDelegate?

    /// Текущий режим. Только для чтения снаружи — меняется через публичное API.
    private(set) var mode: InputBarMode = .normal

    // MARK: - Top panel

    private let topPanel: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.clipsToBounds = true
        return v
    }()

    private let topPanelSeparator: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    // Reply preview
    private let replyPreviewInPanel = ReplyPreviewView()

    // Edit preview
    private let editPreviewView: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let editIconView: UIImageView = {
        let cfg = UIImage.SymbolConfiguration(pointSize: 14, weight: .medium)
        let iv = UIImageView(image: UIImage(systemName: "pencil", withConfiguration: cfg))
        iv.contentMode = .scaleAspectFit
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()

    private let editTitleLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 13, weight: .semibold)
        l.text = NSLocalizedString("chat.inputbar.editing", value: "Editing message", comment: "")
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let editOriginalLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 12)
        l.numberOfLines = 1
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let topPanelCloseButton: UIButton = {
        let btn = UIButton(type: .system)
        let cfg = UIImage.SymbolConfiguration(pointSize: 16, weight: .medium)
        btn.setImage(UIImage(systemName: "xmark.circle.fill", withConfiguration: cfg), for: .normal)
        btn.translatesAutoresizingMaskIntoConstraints = false
        return btn
    }()

    private var topPanelHeightConstraint: NSLayoutConstraint!

    // MARK: - Input row

    private let containerView: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let separatorView: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let attachButton: UIButton = {
        let btn = UIButton(type: .system)
        let cfg = UIImage.SymbolConfiguration(pointSize: 16, weight: .regular)
        btn.setImage(UIImage(systemName: "paperclip", withConfiguration: cfg), for: .normal)
        btn.translatesAutoresizingMaskIntoConstraints = false
        return btn
    }()

    let textView: UITextView = {
        let tv = UITextView()
        tv.font = .systemFont(ofSize: 16)
        tv.layer.cornerRadius       = 18
        tv.textContainerInset       = UIEdgeInsets(top: 8, left: 12, bottom: 8, right: 12)
        tv.isScrollEnabled          = false
        tv.translatesAutoresizingMaskIntoConstraints = false
        return tv
    }()

    private let placeholderLabel: UILabel = {
        let l = UILabel()
        l.text = NSLocalizedString("chat.inputbar.placeholder", value: "Message", comment: "")
        l.font = .systemFont(ofSize: 16)
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let sendButton: UIButton = {
        let btn = UIButton(type: .system)
        let cfg = UIImage.SymbolConfiguration(pointSize: 20, weight: .semibold)
        btn.setImage(UIImage(systemName: "arrow.up.circle.fill", withConfiguration: cfg), for: .normal)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.alpha     = 0.5
        btn.isEnabled = false
        return btn
    }()

    /// Фон, продолжающий containerView вниз в safe-area зону.
    private let bottomBackdropView: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private var textViewHeightConstraint: NSLayoutConstraint!

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupLayout()
        setupActions()
        textView.delegate = self
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Theme

    /// Применяет тему ко всем subviews панели ввода.
    func applyTheme(_ theme: ChatTheme) {
        containerView.backgroundColor      = theme.inputBarBackground
        bottomBackdropView.backgroundColor = theme.inputBarBackground
        separatorView.backgroundColor      = theme.inputBarSeparator
        topPanel.backgroundColor           = theme.replyPanelBackground
        topPanelSeparator.backgroundColor  = theme.inputBarSeparator
        textView.backgroundColor           = theme.inputBarTextViewBg
        textView.textColor                 = theme.inputBarText
        placeholderLabel.textColor         = theme.inputBarPlaceholder
        attachButton.tintColor             = theme.inputBarTint
        sendButton.tintColor               = theme.inputBarTint
        topPanelCloseButton.tintColor      = theme.replyPanelClose
        editIconView.tintColor             = theme.replyPanelAccent
        editTitleLabel.textColor           = theme.replyPanelSender
        editOriginalLabel.textColor        = theme.replyPanelText

        // Перерендерить reply preview с новой темой если она показана
        if case .reply(let info) = mode {
            replyPreviewInPanel.configure(with: ReplyDisplayInfo(fromSnapshot: info), isMine: false, theme: theme)
        }
    }

    // MARK: - Public API

    /// Переключает панель в режим ответа.
    /// Если до этого был edit-режим — очищает поле ввода.
    func beginReply(info: ReplyInfo, theme: ChatTheme) {
        replyPreviewInPanel.configure(with: ReplyDisplayInfo(fromSnapshot: info), isMine: false, theme: theme)
        // При переходе из edit → reply поле содержит старый текст — сбрасываем.
        if case .edit = mode {
            textView.text = ""
            updatePlaceholderVisibility()
            updateSendButtonState()
        }
        transition(to: .reply(info), focusTextView: true)
    }

    /// Переключает панель в режим редактирования с предзаполнением текста.
    func beginEdit(messageId: String, text: String, theme: ChatTheme) {
        applyTheme(theme)
        editOriginalLabel.text = text
        // Ставим текст ДО transition — чтобы высота считалась корректно
        textView.text = text
        updatePlaceholderVisibility()
        updateSendButtonState()
        transition(to: .edit(messageId: messageId, originalText: text), focusTextView: true)
        // Курсор в конец
        let end = textView.endOfDocument
        textView.selectedTextRange = textView.textRange(from: end, to: end)
    }

    /// Сбрасывает текущий режим в .normal БЕЗ уведомления делегата.
    /// Вызывается когда JS-сторона сама сбросила проп (не пользователь).
    func cancelMode() {
        guard mode != .normal else { return }
        transition(to: .normal, focusTextView: false)
    }

    // MARK: - Layout

    private func setupLayout() {
        backgroundColor = .clear

        // ── Top panel ───────────────────────────────────────────────────────
        addSubview(topPanel)
        topPanel.addSubview(topPanelSeparator)

        replyPreviewInPanel.translatesAutoresizingMaskIntoConstraints = false
        topPanel.addSubview(replyPreviewInPanel)

        topPanel.addSubview(editPreviewView)
        editPreviewView.addSubview(editIconView)
        editPreviewView.addSubview(editTitleLabel)
        editPreviewView.addSubview(editOriginalLabel)

        topPanel.addSubview(topPanelCloseButton)

        topPanelHeightConstraint = topPanel.heightAnchor.constraint(equalToConstant: 0)
        NSLayoutConstraint.activate([
            topPanel.topAnchor.constraint(equalTo: topAnchor),
            topPanel.leadingAnchor.constraint(equalTo: leadingAnchor),
            topPanel.trailingAnchor.constraint(equalTo: trailingAnchor),
            topPanelHeightConstraint,

            topPanelSeparator.topAnchor.constraint(equalTo: topPanel.topAnchor),
            topPanelSeparator.leadingAnchor.constraint(equalTo: topPanel.leadingAnchor),
            topPanelSeparator.trailingAnchor.constraint(equalTo: topPanel.trailingAnchor),
            topPanelSeparator.heightAnchor.constraint(equalToConstant: 0.5),

            // ReplyPreview
            replyPreviewInPanel.leadingAnchor.constraint(equalTo: topPanel.leadingAnchor, constant: 8),
            replyPreviewInPanel.trailingAnchor.constraint(equalTo: topPanelCloseButton.leadingAnchor, constant: -4),
            replyPreviewInPanel.topAnchor.constraint(equalTo: topPanel.topAnchor, constant: 6),
            replyPreviewInPanel.bottomAnchor.constraint(equalTo: topPanel.bottomAnchor, constant: -6),

            // EditPreview container
            editPreviewView.leadingAnchor.constraint(equalTo: topPanel.leadingAnchor, constant: 14),
            editPreviewView.trailingAnchor.constraint(equalTo: topPanelCloseButton.leadingAnchor, constant: -4),
            editPreviewView.topAnchor.constraint(equalTo: topPanel.topAnchor, constant: 6),
            editPreviewView.bottomAnchor.constraint(equalTo: topPanel.bottomAnchor, constant: -6),

            editIconView.leadingAnchor.constraint(equalTo: editPreviewView.leadingAnchor),
            editIconView.topAnchor.constraint(equalTo: editPreviewView.topAnchor, constant: 2),
            editIconView.widthAnchor.constraint(equalToConstant: 16),
            editIconView.heightAnchor.constraint(equalToConstant: 16),

            editTitleLabel.leadingAnchor.constraint(equalTo: editIconView.trailingAnchor, constant: 6),
            editTitleLabel.trailingAnchor.constraint(equalTo: editPreviewView.trailingAnchor),
            editTitleLabel.topAnchor.constraint(equalTo: editPreviewView.topAnchor, constant: 2),

            editOriginalLabel.leadingAnchor.constraint(equalTo: editTitleLabel.leadingAnchor),
            editOriginalLabel.trailingAnchor.constraint(equalTo: editPreviewView.trailingAnchor),
            editOriginalLabel.topAnchor.constraint(equalTo: editTitleLabel.bottomAnchor, constant: 2),
            editOriginalLabel.bottomAnchor.constraint(lessThanOrEqualTo: editPreviewView.bottomAnchor, constant: -2),

            topPanelCloseButton.trailingAnchor.constraint(equalTo: topPanel.trailingAnchor, constant: -12),
            topPanelCloseButton.centerYAnchor.constraint(equalTo: topPanel.centerYAnchor),
            topPanelCloseButton.widthAnchor.constraint(equalToConstant: 24),
            topPanelCloseButton.heightAnchor.constraint(equalToConstant: 24),
        ])

        // ── Input container ─────────────────────────────────────────────────
        addSubview(containerView)
        containerView.addSubview(separatorView)
        containerView.addSubview(attachButton)
        containerView.addSubview(textView)
        containerView.addSubview(sendButton)
        textView.addSubview(placeholderLabel)
        insertSubview(bottomBackdropView, belowSubview: containerView)

        textViewHeightConstraint = textView.heightAnchor.constraint(
            equalToConstant: ChatLayoutConstants.inputBarTextViewMinHeight)

        let C = ChatLayoutConstants.self
        NSLayoutConstraint.activate([
            containerView.topAnchor.constraint(equalTo: topPanel.bottomAnchor),
            containerView.leadingAnchor.constraint(equalTo: leadingAnchor),
            containerView.trailingAnchor.constraint(equalTo: trailingAnchor),
            containerView.bottomAnchor.constraint(equalTo: bottomAnchor),

            bottomBackdropView.topAnchor.constraint(equalTo: containerView.bottomAnchor),
            bottomBackdropView.leadingAnchor.constraint(equalTo: leadingAnchor),
            bottomBackdropView.trailingAnchor.constraint(equalTo: trailingAnchor),
            bottomBackdropView.heightAnchor.constraint(equalToConstant: 60),

            separatorView.topAnchor.constraint(equalTo: containerView.topAnchor),
            separatorView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            separatorView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
            separatorView.heightAnchor.constraint(equalToConstant: 0.5),

            attachButton.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 8),
            attachButton.bottomAnchor.constraint(equalTo: containerView.bottomAnchor, constant: -8),
            attachButton.widthAnchor.constraint(equalToConstant: 36),
            attachButton.heightAnchor.constraint(equalToConstant: 36),

            textView.topAnchor.constraint(equalTo: containerView.topAnchor, constant: C.inputBarVerticalPadding),
            textView.leadingAnchor.constraint(equalTo: attachButton.trailingAnchor, constant: 4),
            textView.trailingAnchor.constraint(equalTo: sendButton.leadingAnchor, constant: -8),
            textView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor, constant: -C.inputBarVerticalPadding),
            textViewHeightConstraint,

            sendButton.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -12),
            sendButton.bottomAnchor.constraint(equalTo: textView.bottomAnchor),
            sendButton.widthAnchor.constraint(equalToConstant: 36),
            sendButton.heightAnchor.constraint(equalToConstant: 36),

            placeholderLabel.leadingAnchor.constraint(equalTo: textView.leadingAnchor, constant: 16),
            placeholderLabel.trailingAnchor.constraint(equalTo: textView.trailingAnchor, constant: -16),
            placeholderLabel.topAnchor.constraint(equalTo: textView.topAnchor, constant: 8),
        ])
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        bottomBackdropView.backgroundColor = containerView.backgroundColor
    }

    // MARK: - Actions

    private func setupActions() {
        sendButton.addTarget(self, action: #selector(sendTapped), for: .touchUpInside)
        attachButton.addTarget(self, action: #selector(attachTapped), for: .touchUpInside)
        topPanelCloseButton.addTarget(self, action: #selector(closeTopPanelTapped), for: .touchUpInside)
    }

    @objc private func sendTapped() {
        let text = textView.text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        switch mode {
        case .normal:
            delegate?.inputBar(self, didSendText: text, replyToId: nil)
        case .reply(let info):
            delegate?.inputBar(self, didSendText: text, replyToId: info.replyToId)
        case .edit(let messageId, _):
            delegate?.inputBar(self, didEditText: text, messageId: messageId)
        }

        clearTextAndResetMode()
    }

    @objc private func attachTapped() {
        delegate?.inputBarDidTapAttachment(self)
    }

    /// Пользователь нажал крестик — сохраняем режим для уведомления делегата.
    @objc private func closeTopPanelTapped() {
        let previousMode = mode
        clearTextAndResetMode()

        switch previousMode {
        case .reply:
            delegate?.inputBarDidCancelReply(self)
        case .edit:
            delegate?.inputBarDidCancelEdit(self)
        case .normal:
            break
        }
    }

    // MARK: - Mode transition

    /// Центральный метод смены режима. Все остальные методы идут через него.
    private func transition(to newMode: InputBarMode, focusTextView: Bool) {
        guard mode != newMode else {
            // Режим тот же — только сфокусируемся если нужно
            if focusTextView { textView.becomeFirstResponder() }
            return
        }
        mode = newMode
        applyModeToUI(animated: true)
        if focusTextView { textView.becomeFirstResponder() }
    }

    /// Обновляет constraint и видимость subviews под текущий `mode`.
    /// Использует UIViewPropertyAnimator — прерываемая анимация, безопасна
    /// при вызове из середины другой анимации.
    private func applyModeToUI(animated: Bool) {
        switch mode {
        case .normal:
            topPanelHeightConstraint.constant = 0
            replyPreviewInPanel.isHidden      = true
            editPreviewView.isHidden          = true

        case .reply:
            topPanelHeightConstraint.constant = ChatLayoutConstants.inputBarReplyPanelHeight
            replyPreviewInPanel.isHidden      = false
            editPreviewView.isHidden          = true

        case .edit(_, let originalText):
            topPanelHeightConstraint.constant = ChatLayoutConstants.inputBarReplyPanelHeight
            replyPreviewInPanel.isHidden      = true
            editPreviewView.isHidden          = false
            editOriginalLabel.text            = originalText
        }

        if animated {
            // UIViewPropertyAnimator прерывает любую текущую анимацию этих
            // constraints и стартует с их актуального (in-flight) значения.
            UIViewPropertyAnimator(duration: 0.25, dampingRatio: 0.85) {
                self.layoutIfNeeded()
            }.startAnimation()
        } else {
            layoutIfNeeded()
        }
        notifyHeightChange()
        updateTextViewHeight(animated: animated)
    }

    // MARK: - Internal helpers

    private func clearTextAndResetMode() {
        textView.text = ""
        mode = .normal
        updatePlaceholderVisibility()
        updateSendButtonState()
        applyModeToUI(animated: true)
    }

    private func updatePlaceholderVisibility() {
        placeholderLabel.isHidden = !textView.text.isEmpty
    }

    private func updateSendButtonState() {
        let hasText = !textView.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        UIView.animate(withDuration: 0.15) {
            self.sendButton.alpha     = hasText ? 1.0 : 0.5
            self.sendButton.isEnabled = hasText
        }
    }

    private func updateTextViewHeight(animated: Bool) {
        guard textView.bounds.width > 0 else { return }
        let size = textView.sizeThatFits(
            CGSize(width: textView.bounds.width, height: .greatestFiniteMagnitude))
        let newH = min(
            max(size.height, ChatLayoutConstants.inputBarTextViewMinHeight),
            ChatLayoutConstants.inputBarTextViewMaxHeight
        )
        guard abs(textViewHeightConstraint.constant - newH) > 0.5 else { return }
        textViewHeightConstraint.constant = newH
        textView.isScrollEnabled = newH >= ChatLayoutConstants.inputBarTextViewMaxHeight

        if animated {
            UIView.animate(withDuration: 0.2) { self.layoutIfNeeded() }
        } else {
            layoutIfNeeded()
        }
        notifyHeightChange()
    }

    private func notifyHeightChange() {
        let totalH = textViewHeightConstraint.constant
            + ChatLayoutConstants.inputBarVerticalPadding * 2
            + topPanelHeightConstraint.constant
        delegate?.inputBar(self, didChangeHeight: totalH)
    }
}

// MARK: - UITextViewDelegate

extension InputBarView: UITextViewDelegate {

    func textViewDidChange(_ textView: UITextView) {
        updatePlaceholderVisibility()
        updateSendButtonState()
        updateTextViewHeight(animated: true)
    }

    func textView(
        _ textView: UITextView,
        shouldChangeTextIn range: NSRange,
        replacementText text: String
    ) -> Bool {
        // Enter без Shift = отправка
        if text == "\n" {
            let trimmed = textView.text.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty { sendTapped(); return false }
        }
        return true
    }
}

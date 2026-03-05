// MARK: - InputBarView.swift
// Нативная панель ввода: поле текста, кнопки вложения и отправки,
// панель цитаты (reply preview) и панель редактирования.
//
// Reply-панель заполняется из ReplyInfo — единственная точка истины,
// без дублирования полей senderName/text внутри InputBarView.
//
// Edit-режим: верхняя панель показывает «Editing message» вместо цитаты,
// при отправке вызывается didEditText вместо didSendText.

import UIKit

// MARK: - InputBarMode

/// Текущий режим ввода панели.
enum InputBarMode {
    case normal
    case reply(ReplyInfo)
    case edit(messageId: String, originalText: String)
}

// MARK: - InputBarDelegate

protocol InputBarDelegate: AnyObject {
    /// Пользователь нажал «Отправить» в обычном режиме или режиме ответа.
    func inputBar(_ inputBar: InputBarView, didSendText text: String, replyToId: String?)
    /// Пользователь нажал «Отправить» в режиме редактирования.
    func inputBar(_ inputBar: InputBarView, didEditText text: String, messageId: String)
    /// Пользователь закрыл панель ответа крестиком.
    func inputBarDidCancelReply(_ inputBar: InputBarView)
    /// Пользователь закрыл панель редактирования крестиком.
    func inputBarDidCancelEdit(_ inputBar: InputBarView)
    /// Изменилась высота панели (для анимации пересчёта layout).
    func inputBar(_ inputBar: InputBarView, didChangeHeight height: CGFloat)
    /// Пользователь нажал кнопку вложения.
    func inputBarDidTapAttachment(_ inputBar: InputBarView)
}

// Дефолтные реализации необязательных методов
extension InputBarDelegate {
    func inputBar(_ inputBar: InputBarView, didEditText text: String, messageId: String) {}
    func inputBarDidCancelReply(_ inputBar: InputBarView) {}
    func inputBarDidCancelEdit(_ inputBar: InputBarView) {}
}

// MARK: - InputBarView

final class InputBarView: UIView {

    weak var delegate: InputBarDelegate?

    // MARK: - State

    private(set) var mode: InputBarMode = .normal {
        didSet { updateTopPanel() }
    }

    // MARK: - Top panel (reply / edit)

    private let topPanel: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.isHidden = true
        return v
    }()

    private let topPanelSeparator: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    /// Используется для отображения цитаты (reply-режим).
    private let replyPreviewInPanel = ReplyPreviewView()

    /// Показывается в edit-режиме вместо ReplyPreviewView.
    private let editPreviewView: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.isHidden = true
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

    /// Фон, продолжающий containerView вниз в зону safe area.
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
    }

    // MARK: - Public API

    /// Устанавливает режим ответа. nil — сбрасывает в .normal.
    func setReplyInfo(_ info: ReplyInfo?, theme: ChatTheme) {
        if let info {
            replyPreviewInPanel.configure(with: info, isMine: false, theme: theme)
            mode = .reply(info)
        } else {
            mode = .normal
        }
        if info != nil { textView.becomeFirstResponder() }
    }

    /// Активирует режим редактирования с предзаполнением текста.
    func setEditMessage(id: String, text: String, theme: ChatTheme) {
        applyTheme(theme) // обновим цвета на случай смены темы
        mode = .edit(messageId: id, originalText: text)
        textView.text = text
        updatePlaceholder()
        updateSendButton()
        updateHeight()
        textView.becomeFirstResponder()
        // Перемещаем курсор в конец
        let end = textView.endOfDocument
        textView.selectedTextRange = textView.textRange(from: end, to: end)
    }

    /// Сбрасывает в нормальный режим без уведомления делегата.
    /// Используется из ChatViewController когда JS сам отменяет edit/reply.
    func resetMode() {
        mode = .normal
    }

    /// Очищает поле ввода и сбрасывает режим.
    func clearText() {
        textView.text = ""
        mode = .normal
        updatePlaceholder()
        updateSendButton()
        updateHeight()
    }

    // MARK: - Layout

    private func setupLayout() {
        backgroundColor = .clear

        // ── Top panel (reply / edit) ─────────────────────────────────────────
        addSubview(topPanel)
        topPanel.addSubview(topPanelSeparator)

        replyPreviewInPanel.translatesAutoresizingMaskIntoConstraints = false
        topPanel.addSubview(replyPreviewInPanel)

        // Edit preview subviews
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

            // ReplyPreviewView
            replyPreviewInPanel.leadingAnchor.constraint(equalTo: topPanel.leadingAnchor, constant: 8),
            replyPreviewInPanel.trailingAnchor.constraint(equalTo: topPanelCloseButton.leadingAnchor, constant: -4),
            replyPreviewInPanel.topAnchor.constraint(equalTo: topPanel.topAnchor, constant: 6),
            replyPreviewInPanel.bottomAnchor.constraint(equalTo: topPanel.bottomAnchor, constant: -6),

            // Edit preview container
            editPreviewView.leadingAnchor.constraint(equalTo: topPanel.leadingAnchor, constant: 14),
            editPreviewView.trailingAnchor.constraint(equalTo: topPanelCloseButton.leadingAnchor, constant: -4),
            editPreviewView.topAnchor.constraint(equalTo: topPanel.topAnchor, constant: 6),
            editPreviewView.bottomAnchor.constraint(equalTo: topPanel.bottomAnchor, constant: -6),

            // Edit icon
            editIconView.leadingAnchor.constraint(equalTo: editPreviewView.leadingAnchor),
            editIconView.topAnchor.constraint(equalTo: editPreviewView.topAnchor, constant: 2),
            editIconView.widthAnchor.constraint(equalToConstant: 16),
            editIconView.heightAnchor.constraint(equalToConstant: 16),

            // Edit title label
            editTitleLabel.leadingAnchor.constraint(equalTo: editIconView.trailingAnchor, constant: 6),
            editTitleLabel.trailingAnchor.constraint(equalTo: editPreviewView.trailingAnchor),
            editTitleLabel.topAnchor.constraint(equalTo: editPreviewView.topAnchor, constant: 2),

            // Edit original text label
            editOriginalLabel.leadingAnchor.constraint(equalTo: editTitleLabel.leadingAnchor),
            editOriginalLabel.trailingAnchor.constraint(equalTo: editPreviewView.trailingAnchor),
            editOriginalLabel.topAnchor.constraint(equalTo: editTitleLabel.bottomAnchor, constant: 2),
            editOriginalLabel.bottomAnchor.constraint(lessThanOrEqualTo: editPreviewView.bottomAnchor, constant: -2),

            // Close button
            topPanelCloseButton.trailingAnchor.constraint(equalTo: topPanel.trailingAnchor, constant: -12),
            topPanelCloseButton.centerYAnchor.constraint(equalTo: topPanel.centerYAnchor),
            topPanelCloseButton.widthAnchor.constraint(equalToConstant: 24),
            topPanelCloseButton.heightAnchor.constraint(equalToConstant: 24),
        ])

        // ── Input container ──────────────────────────────────────────────────
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
        topPanelCloseButton.addTarget(self, action: #selector(closeTopPanel), for: .touchUpInside)
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

        clearText()
    }

    @objc private func attachTapped() {
        delegate?.inputBarDidTapAttachment(self)
    }

    /// Закрытие верхней панели — разные события для reply и edit.
    @objc private func closeTopPanel() {
        let previousMode = mode
        mode = .normal
        textView.text = ""
        updatePlaceholder()
        updateSendButton()
        updateHeight()

        switch previousMode {
        case .reply:
            delegate?.inputBarDidCancelReply(self)
        case .edit:
            delegate?.inputBarDidCancelEdit(self)
        case .normal:
            break
        }
    }

    // MARK: - Top panel update

    /// Синхронизирует видимость и содержимое верхней панели с текущим mode.
    private func updateTopPanel() {
        switch mode {
        case .normal:
            topPanel.isHidden                  = true
            topPanelHeightConstraint.constant  = 0
            replyPreviewInPanel.isHidden       = true
            editPreviewView.isHidden           = true

        case .reply:
            topPanel.isHidden                  = false
            topPanelHeightConstraint.constant  = ChatLayoutConstants.inputBarReplyPanelHeight
            replyPreviewInPanel.isHidden       = false
            editPreviewView.isHidden           = true

        case .edit(_, let originalText):
            topPanel.isHidden                  = false
            topPanelHeightConstraint.constant  = ChatLayoutConstants.inputBarReplyPanelHeight
            replyPreviewInPanel.isHidden       = true
            editPreviewView.isHidden           = false
            editOriginalLabel.text             = originalText
        }

        UIView.animate(withDuration: 0.2) { self.layoutIfNeeded() }
        notifyHeightChange()
    }

    // MARK: - Helpers

    private func updatePlaceholder() {
        placeholderLabel.isHidden = !textView.text.isEmpty
    }

    private func updateSendButton() {
        let hasText = !textView.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        UIView.animate(withDuration: 0.2) {
            self.sendButton.alpha     = hasText ? 1.0 : 0.5
            self.sendButton.isEnabled = hasText
        }
    }

    private func updateHeight() {
        let size = textView.sizeThatFits(
            CGSize(width: textView.bounds.width, height: .greatestFiniteMagnitude))
        let newH = min(
            max(size.height, ChatLayoutConstants.inputBarTextViewMinHeight),
            ChatLayoutConstants.inputBarTextViewMaxHeight
        )
        guard textViewHeightConstraint.constant != newH else { return }
        textViewHeightConstraint.constant = newH
        textView.isScrollEnabled = newH >= ChatLayoutConstants.inputBarTextViewMaxHeight
        UIView.animate(withDuration: 0.2) { self.layoutIfNeeded() }
        notifyHeightChange()
    }

    private func notifyHeightChange() {
        let topPanelH = topPanelHeightConstraint.constant
        let totalH    = textViewHeightConstraint.constant
                      + ChatLayoutConstants.inputBarVerticalPadding * 2
                      + topPanelH
        delegate?.inputBar(self, didChangeHeight: totalH)
    }
}

// MARK: - UITextViewDelegate

extension InputBarView: UITextViewDelegate {

    func textViewDidChange(_ textView: UITextView) {
        updatePlaceholder()
        updateSendButton()
        updateHeight()
    }

    func textView(
        _ textView: UITextView,
        shouldChangeTextIn range: NSRange,
        replacementText text: String
    ) -> Bool {
        if text == "\n" {
            let trimmed = textView.text.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty { sendTapped(); return false }
        }
        return true
    }
}

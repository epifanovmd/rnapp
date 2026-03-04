// MARK: - InputBarView.swift
// Нативная панель ввода: поле текста, кнопки вложения и отправки,
// панель цитаты (reply preview).
//
// Reply-панель заполняется из ReplyInfo — единственная точка истины,
// без дублирования полей senderName/text внутри InputBarView.

import UIKit

// MARK: - InputBarDelegate

protocol InputBarDelegate: AnyObject {
    /// Пользователь нажал «Отправить».
    func inputBar(_ inputBar: InputBarView, didSendText text: String, replyToId: String?)
    /// Изменилась высота панели (для анимации пересчёта layout).
    func inputBar(_ inputBar: InputBarView, didChangeHeight height: CGFloat)
    /// Пользователь нажал кнопку вложения.
    func inputBarDidTapAttachment(_ inputBar: InputBarView)
}

// MARK: - InputBarView

final class InputBarView: UIView {

    weak var delegate: InputBarDelegate?

    // MARK: - State

    /// Текущая цитата. Все UI-обновления панели цитаты — через didSet.
    private var replyInfo: ReplyInfo? {
        didSet { updateReplyPanel() }
    }

    // MARK: - Reply panel

    private let replyPanel: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.isHidden = true
        return v
    }()

    private let replyPanelSeparator: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    /// ReplyPreviewView переиспользуется из MessageContentViews —
    /// единый компонент отображения цитаты в приложении.
    private let replyPreviewInPanel = ReplyPreviewView()

    private let replyCloseButton: UIButton = {
        let btn = UIButton(type: .system)
        let cfg = UIImage.SymbolConfiguration(pointSize: 16, weight: .medium)
        btn.setImage(UIImage(systemName: "xmark.circle.fill", withConfiguration: cfg), for: .normal)
        btn.translatesAutoresizingMaskIntoConstraints = false
        return btn
    }()

    private var replyPanelHeightConstraint: NSLayoutConstraint!

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
        containerView.backgroundColor   = theme.inputBarBackground
        bottomBackdropView.backgroundColor = theme.inputBarBackground
        separatorView.backgroundColor   = theme.inputBarSeparator
        replyPanel.backgroundColor      = theme.replyPanelBackground
        replyPanelSeparator.backgroundColor = theme.inputBarSeparator
        textView.backgroundColor        = theme.inputBarTextViewBg
        textView.textColor              = theme.inputBarText
        placeholderLabel.textColor      = theme.inputBarPlaceholder
        attachButton.tintColor          = theme.inputBarTint
        sendButton.tintColor            = theme.inputBarTint
        replyCloseButton.tintColor      = theme.replyPanelClose

        // ReplyPreviewView перерисуется при следующем setReplyInfo
    }

    // MARK: - Public API

    /// Устанавливает цитируемое сообщение. nil — скрывает панель.
    func setReplyInfo(_ info: ReplyInfo?, theme: ChatTheme) {
        replyInfo = info
        // Принудительно обновить цвета, т.к. тема может меняться независимо
        if let info {
            replyPreviewInPanel.configure(with: info, isMine: false, theme: theme)
        }
        if info != nil { textView.becomeFirstResponder() }
    }

    /// Очищает поле ввода и сбрасывает цитату.
    func clearText() {
        textView.text = ""
        replyInfo = nil
        updatePlaceholder()
        updateSendButton()
        updateHeight()
    }

    // MARK: - Layout

    private func setupLayout() {
        backgroundColor = .clear

        // ── Reply panel ──────────────────────────────────────────────────────
        addSubview(replyPanel)
        replyPanel.addSubview(replyPanelSeparator)
        replyPreviewInPanel.translatesAutoresizingMaskIntoConstraints = false
        replyPanel.addSubview(replyPreviewInPanel)
        replyPanel.addSubview(replyCloseButton)

        replyPanelHeightConstraint = replyPanel.heightAnchor.constraint(equalToConstant: 0)
        NSLayoutConstraint.activate([
            replyPanel.topAnchor.constraint(equalTo: topAnchor),
            replyPanel.leadingAnchor.constraint(equalTo: leadingAnchor),
            replyPanel.trailingAnchor.constraint(equalTo: trailingAnchor),
            replyPanelHeightConstraint,

            replyPanelSeparator.topAnchor.constraint(equalTo: replyPanel.topAnchor),
            replyPanelSeparator.leadingAnchor.constraint(equalTo: replyPanel.leadingAnchor),
            replyPanelSeparator.trailingAnchor.constraint(equalTo: replyPanel.trailingAnchor),
            replyPanelSeparator.heightAnchor.constraint(equalToConstant: 0.5),

            // ReplyPreviewView занимает всё пространство, кроме кнопки закрытия
            replyPreviewInPanel.leadingAnchor.constraint(equalTo: replyPanel.leadingAnchor, constant: 8),
            replyPreviewInPanel.trailingAnchor.constraint(equalTo: replyCloseButton.leadingAnchor, constant: -4),
            replyPreviewInPanel.topAnchor.constraint(equalTo: replyPanel.topAnchor, constant: 6),
            replyPreviewInPanel.bottomAnchor.constraint(equalTo: replyPanel.bottomAnchor, constant: -6),

            replyCloseButton.trailingAnchor.constraint(equalTo: replyPanel.trailingAnchor, constant: -12),
            replyCloseButton.centerYAnchor.constraint(equalTo: replyPanel.centerYAnchor),
            replyCloseButton.widthAnchor.constraint(equalToConstant: 24),
            replyCloseButton.heightAnchor.constraint(equalToConstant: 24),
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
            containerView.topAnchor.constraint(equalTo: replyPanel.bottomAnchor),
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
        // Синхронизируем backdrop с фактическим цветом контейнера
        bottomBackdropView.backgroundColor = containerView.backgroundColor
    }

    // MARK: - Actions

    private func setupActions() {
        sendButton.addTarget(self, action: #selector(sendTapped), for: .touchUpInside)
        attachButton.addTarget(self, action: #selector(attachTapped), for: .touchUpInside)
        replyCloseButton.addTarget(self, action: #selector(clearReply), for: .touchUpInside)
    }

    @objc private func sendTapped() {
        let text = textView.text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        let replyId = replyInfo?.replyToId
        delegate?.inputBar(self, didSendText: text, replyToId: replyId)
        textView.text = ""
        replyInfo = nil
        updatePlaceholder()
        updateSendButton()
        updateHeight()
    }

    @objc private func attachTapped() {
        delegate?.inputBarDidTapAttachment(self)
    }

    @objc private func clearReply() {
        replyInfo = nil
    }

    // MARK: - Reply panel update

    /// Синхронизирует видимость и высоту панели цитаты с текущим replyInfo.
    private func updateReplyPanel() {
        let hasReply = replyInfo != nil
        replyPanel.isHidden               = !hasReply
        replyPanelHeightConstraint.constant = hasReply
            ? ChatLayoutConstants.inputBarReplyPanelHeight
            : 0
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
        let replyH  = replyInfo != nil ? ChatLayoutConstants.inputBarReplyPanelHeight : 0
        let totalH  = textViewHeightConstraint.constant
                    + ChatLayoutConstants.inputBarVerticalPadding * 2
                    + replyH
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
        // Нажатие Return без Shift → отправка (как в Telegram)
        if text == "\n" {
            let trimmed = textView.text.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty { sendTapped(); return false }
        }
        return true
    }
}

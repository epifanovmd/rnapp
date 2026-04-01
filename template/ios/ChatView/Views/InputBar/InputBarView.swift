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
        case (.normal, .normal):                     return true
        case (.reply(let a), .reply(let b)):         return a == b
        case (.edit(let id1, _), .edit(let id2, _)): return id1 == id2
        default:                                     return false
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
    /// Запись голоса начата (hold mic button).
    func inputBarDidStartVoiceRecording(_ bar: InputBarView)
    /// Запись голоса завершена (отпустили или locked → tap stop).
    func inputBarDidStopVoiceRecording(_ bar: InputBarView)
    /// Запись голоса отменена (slide left to cancel).
    func inputBarDidCancelVoiceRecording(_ bar: InputBarView)
}

/// Необязательные методы с пустой реализацией по умолчанию.
extension InputBarDelegate {
    func inputBar(_ bar: InputBarView, didEditText text: String, messageId: String) {}
    func inputBarDidCancelReply(_ bar: InputBarView) {}
    func inputBarDidCancelEdit(_ bar: InputBarView) {}
    func inputBarDidStartVoiceRecording(_ bar: InputBarView) {}
    func inputBarDidStopVoiceRecording(_ bar: InputBarView) {}
    func inputBarDidCancelVoiceRecording(_ bar: InputBarView) {}
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

    private let replyPreviewInPanel = ReplyPreviewView()

    private let editPreviewView: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let editIconView: UIImageView = {
        let cfg = UIImage.SymbolConfiguration(pointSize: 14, weight: .medium)
        let iv  = UIImageView(image: UIImage(systemName: "pencil", withConfiguration: cfg))
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
        tv.layer.cornerRadius   = 18
        tv.textContainerInset   = UIEdgeInsets(top: 8, left: 12, bottom: 8, right: 12)
        tv.isScrollEnabled      = false
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
        btn.isHidden  = true // hidden by default, shown when text is not empty
        return btn
    }()

    private let voiceButton: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        let cfg = UIImage.SymbolConfiguration(pointSize: 20, weight: .regular)
        let iv = UIImageView(image: UIImage(systemName: "mic.fill", withConfiguration: cfg))
        iv.tag = 100
        iv.contentMode = .center
        iv.translatesAutoresizingMaskIntoConstraints = false
        v.addSubview(iv)
        NSLayoutConstraint.activate([
            iv.centerXAnchor.constraint(equalTo: v.centerXAnchor),
            iv.centerYAnchor.constraint(equalTo: v.centerYAnchor),
        ])
        return v
    }()

    // MARK: - Recording overlay

    private let recordingOverlay: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.isHidden = true
        v.alpha = 0
        return v
    }()

    private let recordingDot: UIView = {
        let v = UIView()
        v.backgroundColor = .systemRed
        v.layer.cornerRadius = 5
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let recordingTimeLabel: UILabel = {
        let l = UILabel()
        l.font = UIFont.monospacedDigitSystemFont(ofSize: 15, weight: .medium)
        l.text = "0:00"
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let slideToCancel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 14)
        l.text = "◀ Slide to cancel"
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let lockContainer: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.layer.cornerRadius = 20
        v.clipsToBounds = true
        v.isHidden = true
        return v
    }()

    private let lockIcon: UIImageView = {
        let cfg = UIImage.SymbolConfiguration(pointSize: 16, weight: .medium)
        let iv = UIImageView(image: UIImage(systemName: "lock.fill", withConfiguration: cfg))
        iv.contentMode = .center
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()

    private let stopButton: UIButton = {
        let btn = UIButton(type: .system)
        let cfg = UIImage.SymbolConfiguration(pointSize: 22, weight: .medium)
        btn.setImage(UIImage(systemName: "stop.circle.fill", withConfiguration: cfg), for: .normal)
        btn.tintColor = .systemRed
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.isHidden = true
        return btn
    }()

    private(set) var isRecording = false
    private var isLocked = false
    private var recordingStartLocation: CGPoint = .zero

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

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented — use init(frame:)")
    }

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
        (voiceButton.viewWithTag(100) as? UIImageView)?.tintColor = theme.inputBarTint
        recordingOverlay.backgroundColor   = theme.inputBarBackground
        recordingTimeLabel.textColor       = theme.inputBarText
        slideToCancel.textColor            = theme.inputBarPlaceholder
        lockContainer.backgroundColor      = theme.inputBarTextViewBg
        lockIcon.tintColor                 = theme.inputBarTint
        topPanelCloseButton.tintColor      = theme.replyPanelClose
        editIconView.tintColor             = theme.replyPanelAccent
        editTitleLabel.textColor           = theme.replyPanelSender
        editOriginalLabel.textColor        = theme.replyPanelText

        if case .reply(let info) = mode {
            replyPreviewInPanel.configure(with: ReplyDisplayInfo(fromSnapshot: info), isMine: false, theme: theme)
        }
    }

    // MARK: - Public API

    /// Переключает панель в режим ответа.
    /// Если до этого был edit-режим — очищает поле ввода.
    func beginReply(info: ReplyInfo, theme: ChatTheme) {
        replyPreviewInPanel.configure(with: ReplyDisplayInfo(fromSnapshot: info), isMine: false, theme: theme)
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
        textView.text          = text
        updatePlaceholderVisibility()
        updateSendButtonState()
        transition(to: .edit(messageId: messageId, originalText: text), focusTextView: true)
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

        // ── Top panel ─────────────────────────────────────────────────────────
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

            replyPreviewInPanel.leadingAnchor.constraint(equalTo: topPanel.leadingAnchor, constant: 8),
            replyPreviewInPanel.trailingAnchor.constraint(equalTo: topPanelCloseButton.leadingAnchor, constant: -4),
            replyPreviewInPanel.topAnchor.constraint(equalTo: topPanel.topAnchor, constant: 6),
            replyPreviewInPanel.bottomAnchor.constraint(equalTo: topPanel.bottomAnchor, constant: -6),

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

        // ── Input container ───────────────────────────────────────────────────
        addSubview(containerView)
        containerView.addSubview(separatorView)
        containerView.addSubview(attachButton)
        containerView.addSubview(textView)
        containerView.addSubview(sendButton)
        containerView.addSubview(voiceButton)
        textView.addSubview(placeholderLabel)

        // Recording overlay
        containerView.addSubview(recordingOverlay)
        recordingOverlay.addSubview(recordingDot)
        recordingOverlay.addSubview(recordingTimeLabel)
        recordingOverlay.addSubview(slideToCancel)
        containerView.addSubview(lockContainer)
        lockContainer.addSubview(lockIcon)
        containerView.addSubview(stopButton)
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

            voiceButton.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -12),
            voiceButton.bottomAnchor.constraint(equalTo: textView.bottomAnchor),
            voiceButton.widthAnchor.constraint(equalToConstant: 36),
            voiceButton.heightAnchor.constraint(equalToConstant: 36),

            // Recording overlay
            recordingOverlay.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 12),
            recordingOverlay.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -56),
            recordingOverlay.topAnchor.constraint(equalTo: separatorView.bottomAnchor),
            recordingOverlay.bottomAnchor.constraint(equalTo: containerView.bottomAnchor),

            recordingDot.leadingAnchor.constraint(equalTo: recordingOverlay.leadingAnchor, constant: 4),
            recordingDot.centerYAnchor.constraint(equalTo: recordingOverlay.centerYAnchor),
            recordingDot.widthAnchor.constraint(equalToConstant: 10),
            recordingDot.heightAnchor.constraint(equalToConstant: 10),

            recordingTimeLabel.leadingAnchor.constraint(equalTo: recordingDot.trailingAnchor, constant: 8),
            recordingTimeLabel.centerYAnchor.constraint(equalTo: recordingOverlay.centerYAnchor),

            slideToCancel.centerXAnchor.constraint(equalTo: recordingOverlay.centerXAnchor, constant: 20),
            slideToCancel.centerYAnchor.constraint(equalTo: recordingOverlay.centerYAnchor),

            // Lock container (above voice button)
            lockContainer.centerXAnchor.constraint(equalTo: voiceButton.centerXAnchor),
            lockContainer.bottomAnchor.constraint(equalTo: voiceButton.topAnchor, constant: -8),
            lockContainer.widthAnchor.constraint(equalToConstant: 40),
            lockContainer.heightAnchor.constraint(equalToConstant: 60),

            lockIcon.centerXAnchor.constraint(equalTo: lockContainer.centerXAnchor),
            lockIcon.centerYAnchor.constraint(equalTo: lockContainer.centerYAnchor),

            // Stop button (same position as voice button, shown when locked)
            stopButton.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -12),
            stopButton.bottomAnchor.constraint(equalTo: textView.bottomAnchor),
            stopButton.widthAnchor.constraint(equalToConstant: 36),
            stopButton.heightAnchor.constraint(equalToConstant: 36),

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
        stopButton.addTarget(self, action: #selector(stopRecordingTapped), for: .touchUpInside)

        // Voice: long press to start, pan to lock/cancel
        let longPress = UILongPressGestureRecognizer(target: self, action: #selector(handleVoiceLongPress(_:)))
        longPress.minimumPressDuration = 0.15
        voiceButton.addGestureRecognizer(longPress)
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

    @objc private func stopRecordingTapped() {
        finishRecording()
    }

    @objc private func handleVoiceLongPress(_ gesture: UILongPressGestureRecognizer) {
        let location = gesture.location(in: containerView)

        switch gesture.state {
        case .began:
            recordingStartLocation = location
            startRecordingUI()
            delegate?.inputBarDidStartVoiceRecording(self)

        case .changed:
            guard isRecording, !isLocked else { return }
            let dx = max(0, recordingStartLocation.x - location.x)
            let dy = max(0, recordingStartLocation.y - location.y)

            // Slide left to cancel (> 100pt)
            if dx > 100 {
                let wasCancelled = isRecording
                resetRecordingUI()
                if wasCancelled {
                    delegate?.inputBarDidCancelVoiceRecording(self)
                }
                gesture.isEnabled = false
                gesture.isEnabled = true
                return
            }

            // Slide up to lock (> 60pt)
            if dy > 60 {
                lockRecording()
                return
            }

            // Update slide-to-cancel opacity
            let cancelProgress = dx / 100
            slideToCancel.alpha = 1.0 - cancelProgress * 0.5

            // Update lock container
            let lockProgress = dy / 60
            lockContainer.alpha = 0.5 + lockProgress * 0.5
            lockContainer.transform = CGAffineTransform(scaleX: 1 + lockProgress * 0.15,
                                                         y: 1 + lockProgress * 0.15)

        case .ended, .cancelled:
            guard isRecording, !isLocked else { return }
            finishRecording()

        default:
            break
        }
    }

    // MARK: - Recording UI

    private func startRecordingUI() {
        isRecording = true
        isLocked = false

        // Hide normal input
        textView.isHidden = true
        placeholderLabel.isHidden = true
        attachButton.isHidden = true
        sendButton.isHidden = true

        // Show recording overlay
        recordingOverlay.isHidden = false
        lockContainer.isHidden = false
        lockContainer.alpha = 0.5
        lockContainer.transform = .identity
        stopButton.isHidden = true

        // Animate in
        UIView.animate(withDuration: 0.2) {
            self.recordingOverlay.alpha = 1
        }

        // Pulsing red dot
        UIView.animate(withDuration: 0.6,
                       delay: 0,
                       options: [.autoreverse, .repeat],
                       animations: { self.recordingDot.alpha = 0.3 })

        // Mic button grows
        UIView.animate(withDuration: 0.15,
                       delay: 0,
                       usingSpringWithDamping: 0.5,
                       initialSpringVelocity: 0.8,
                       options: [],
                       animations: { self.voiceButton.transform = CGAffineTransform(scaleX: 1.4, y: 1.4) })
    }

    private func lockRecording() {
        isLocked = true

        UIView.animate(withDuration: 0.2) {
            self.lockContainer.isHidden = true
            self.slideToCancel.isHidden = true
            self.stopButton.isHidden = false
            self.voiceButton.transform = .identity
            self.voiceButton.isHidden = true
        }
    }

    private func finishRecording() {
        guard isRecording else { return }
        resetRecordingUI()
        delegate?.inputBarDidStopVoiceRecording(self)
    }

    private func cancelRecordingUI() {
        guard isRecording else { return }
        resetRecordingUI()
    }

    func resetRecordingUI() {
        isRecording = false
        isLocked = false

        recordingDot.layer.removeAllAnimations()
        recordingDot.alpha = 1

        UIView.animate(withDuration: 0.2) {
            self.recordingOverlay.alpha = 0
            self.voiceButton.transform = .identity
        } completion: { _ in
            self.recordingOverlay.isHidden = true
            self.lockContainer.isHidden = true
            self.stopButton.isHidden = true
            self.slideToCancel.isHidden = false

            // Restore normal input
            self.textView.isHidden = false
            self.attachButton.isHidden = false
            self.voiceButton.isHidden = false
            self.updatePlaceholderVisibility()
            self.updateSendButtonState()
        }

        recordingTimeLabel.text = "0:00"
    }

    /// Вызывается извне для обновления таймера.
    func updateRecordingTime(_ seconds: TimeInterval) {
        let total = Int(seconds)
        let m = total / 60
        let s = total % 60
        recordingTimeLabel.text = String(format: "%d:%02d", m, s)
    }

    /// Пользователь нажал крестик — сохраняем режим для уведомления делегата.
    @objc private func closeTopPanelTapped() {
        let previousMode = mode
        clearTextAndResetMode()

        switch previousMode {
        case .reply: delegate?.inputBarDidCancelReply(self)
        case .edit:  delegate?.inputBarDidCancelEdit(self)
        case .normal: break
        }
    }

    // MARK: - Mode transition

    /// Центральный метод смены режима. Все остальные методы идут через него.
    private func transition(to newMode: InputBarMode, focusTextView: Bool) {
        guard mode != newMode else {
            if focusTextView { textView.becomeFirstResponder() }
            return
        }
        mode = newMode
        applyModeToUI(animated: true)
        if focusTextView { textView.becomeFirstResponder() }
    }

    /// Обновляет constraints и видимость subviews под текущий `mode`.
    /// Все изменения layout собираются в один проход — один вызов layoutIfNeeded()
    /// и один notifyHeightChange() без лишних повторов.
    private func applyModeToUI(animated: Bool) {
        // 1. Обновляем constraints топ-панели
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

        // 2. Обновляем constraint textView
        updateTextViewHeightConstraint()

        // 3. Единый layout-проход + единый notifyHeightChange
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
            self.sendButton.isHidden  = !hasText
            self.sendButton.alpha     = hasText ? 1.0 : 0.5
            self.sendButton.isEnabled = hasText
            self.voiceButton.isHidden = hasText
        }
    }

    /// Обновляет только constraint высоты textView — без layout-прохода.
    /// Вызывается из applyModeToUI перед единым layoutIfNeeded().
    private func updateTextViewHeightConstraint() {
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
    }

    /// Уведомляет делегата об изменении высоты.
    /// Вычисляет высоту из текущих constraint-значений — вызывать ПОСЛЕ layoutIfNeeded().
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
        // Обновляем constraint и делаем layout+notify в одном месте
        updateTextViewHeightConstraint()
        UIView.animate(withDuration: 0.2) { self.layoutIfNeeded() }
        notifyHeightChange()
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

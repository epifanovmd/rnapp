// MARK: - InputBarView.swift
// Native input bar: attachment button, send button, reply-preview panel

import UIKit

protocol InputBarDelegate: AnyObject {
    func inputBar(_ inputBar: InputBarView, didSendText text: String, replyToId: String?)
    func inputBar(_ inputBar: InputBarView, didChangeHeight height: CGFloat)
    func inputBarDidTapAttachment(_ inputBar: InputBarView)
}

final class InputBarView: UIView {

    weak var delegate: InputBarDelegate?

    // MARK: - Reply Preview

    private var replyToMessage: ChatMessage? {
        didSet { updateReplyPreview() }
    }

    private let replyPanel: UIView = {
        let v = UIView()
        v.backgroundColor = UIColor.systemBackground
        v.translatesAutoresizingMaskIntoConstraints = false
        v.isHidden = true
        return v
    }()

    private let replyPanelSeparator: UIView = {
        let v = UIView()
        v.backgroundColor = UIColor.separator.withAlphaComponent(0.3)
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let replyAccentBar: UIView = {
        let v = UIView()
        v.backgroundColor = .systemBlue
        v.layer.cornerRadius = 1.5
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let replySenderLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 13, weight: .semibold)
        l.textColor = .systemBlue
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let replyTextLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 13)
        l.textColor = .secondaryLabel
        l.numberOfLines = 1
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let replyCloseButton: UIButton = {
        let btn = UIButton(type: .system)
        let config = UIImage.SymbolConfiguration(pointSize: 16, weight: .medium)
        btn.setImage(UIImage(systemName: "xmark.circle.fill", withConfiguration: config), for: .normal)
        btn.tintColor = .tertiaryLabel
        btn.translatesAutoresizingMaskIntoConstraints = false
        return btn
    }()

    private var replyPanelHeightConstraint: NSLayoutConstraint!

    // MARK: - Input Row

    private let containerView: UIView = {
        let v = UIView()
        v.backgroundColor = .systemBackground
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let separatorView: UIView = {
        let v = UIView()
        v.backgroundColor = UIColor.separator.withAlphaComponent(0.3)
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let attachButton: UIButton = {
        let btn = UIButton(type: .system)
        let config = UIImage.SymbolConfiguration(pointSize: 22, weight: .regular)
        btn.setImage(UIImage(systemName: "paperclip", withConfiguration: config), for: .normal)
        btn.tintColor = .systemBlue
        btn.translatesAutoresizingMaskIntoConstraints = false
        return btn
    }()

    let textView: UITextView = {
        let tv = UITextView()
        tv.font = .systemFont(ofSize: 16)
        tv.backgroundColor = UIColor.systemGray6
        tv.layer.cornerRadius = 18
        tv.textContainerInset = UIEdgeInsets(top: 8, left: 12, bottom: 8, right: 12)
        tv.isScrollEnabled = false
        tv.translatesAutoresizingMaskIntoConstraints = false
        return tv
    }()

    private let placeholderLabel: UILabel = {
        let l = UILabel()
        l.text = "Message"
        l.font = .systemFont(ofSize: 16)
        l.textColor = .placeholderText
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let sendButton: UIButton = {
        let btn = UIButton(type: .system)
        let config = UIImage.SymbolConfiguration(pointSize: 20, weight: .semibold)
        btn.setImage(UIImage(systemName: "arrow.up.circle.fill", withConfiguration: config), for: .normal)
        btn.tintColor = .systemBlue
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.alpha = 0.5
        btn.isEnabled = false
        return btn
    }()

    private var textViewHeightConstraint: NSLayoutConstraint!
    private let maxHeight: CGFloat = 120
    private let minHeight: CGFloat = 36

    /// Extends the containerView background color down into the safe area zone,
    /// so there's no transparent gap between the input bar and the screen edge.
    private let bottomBackdropView: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupLayout()
        setupActions()
        textView.delegate = self
    }

    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Layout

    private func setupLayout() {
        backgroundColor = .clear

        // Reply panel
        addSubview(replyPanel)
        replyPanel.addSubview(replyPanelSeparator)
        replyPanel.addSubview(replyAccentBar)
        replyPanel.addSubview(replySenderLabel)
        replyPanel.addSubview(replyTextLabel)
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

            replyAccentBar.leadingAnchor.constraint(equalTo: replyPanel.leadingAnchor, constant: 12),
            replyAccentBar.topAnchor.constraint(equalTo: replyPanel.topAnchor, constant: 8),
            replyAccentBar.bottomAnchor.constraint(equalTo: replyPanel.bottomAnchor, constant: -8),
            replyAccentBar.widthAnchor.constraint(equalToConstant: 3),

            replySenderLabel.leadingAnchor.constraint(equalTo: replyAccentBar.trailingAnchor, constant: 8),
            replySenderLabel.trailingAnchor.constraint(equalTo: replyCloseButton.leadingAnchor, constant: -8),
            replySenderLabel.topAnchor.constraint(equalTo: replyPanel.topAnchor, constant: 8),

            replyTextLabel.leadingAnchor.constraint(equalTo: replySenderLabel.leadingAnchor),
            replyTextLabel.trailingAnchor.constraint(equalTo: replySenderLabel.trailingAnchor),
            replyTextLabel.topAnchor.constraint(equalTo: replySenderLabel.bottomAnchor, constant: 2),

            replyCloseButton.trailingAnchor.constraint(equalTo: replyPanel.trailingAnchor, constant: -12),
            replyCloseButton.centerYAnchor.constraint(equalTo: replyPanel.centerYAnchor),
            replyCloseButton.widthAnchor.constraint(equalToConstant: 24),
            replyCloseButton.heightAnchor.constraint(equalToConstant: 24),
        ])

        // Input container
        addSubview(containerView)
        containerView.addSubview(separatorView)
        containerView.addSubview(attachButton)
        containerView.addSubview(textView)
        containerView.addSubview(sendButton)
        textView.addSubview(placeholderLabel)

        textViewHeightConstraint = textView.heightAnchor.constraint(equalToConstant: minHeight)

        // Backdrop fills the gap between containerView bottom and screen edge (safe area zone).
        insertSubview(bottomBackdropView, belowSubview: containerView)

        NSLayoutConstraint.activate([
            containerView.topAnchor.constraint(equalTo: replyPanel.bottomAnchor),
            containerView.leadingAnchor.constraint(equalTo: leadingAnchor),
            containerView.trailingAnchor.constraint(equalTo: trailingAnchor),
            containerView.bottomAnchor.constraint(equalTo: bottomAnchor),

            // Backdrop: same horizontal, starts at containerView bottom, tall enough to cover any safe area.
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

            textView.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 8),
            textView.leadingAnchor.constraint(equalTo: attachButton.trailingAnchor, constant: 4),
            textView.trailingAnchor.constraint(equalTo: sendButton.leadingAnchor, constant: -8),
            textView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor, constant: -8),
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

    // Keep backdrop color in sync with containerView (supports dark mode changes).
    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        bottomBackdropView.backgroundColor = containerView.backgroundColor
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        bottomBackdropView.backgroundColor = containerView.backgroundColor
    }

    private func setupActions() {
        sendButton.addTarget(self, action: #selector(sendTapped), for: .touchUpInside)
        attachButton.addTarget(self, action: #selector(attachTapped), for: .touchUpInside)
        replyCloseButton.addTarget(self, action: #selector(clearReply), for: .touchUpInside)
    }

    // MARK: - Actions

    @objc private func sendTapped() {
        let text = textView.text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        let replyId = replyToMessage?.id
        delegate?.inputBar(self, didSendText: text, replyToId: replyId)
        textView.text = ""
        replyToMessage = nil
        updatePlaceholder()
        updateSendButton()
        updateHeight()
    }

    @objc private func attachTapped() {
        delegate?.inputBarDidTapAttachment(self)
    }

    @objc func clearReply() {
        replyToMessage = nil
    }

    // MARK: - Reply

    func setReplyMessage(_ message: ChatMessage?) {
        replyToMessage = message
        if message != nil {
            textView.becomeFirstResponder()
        }
    }

    private func updateReplyPreview() {
        if let msg = replyToMessage {
            replyPanel.isHidden = false
            replyPanelHeightConstraint.constant = 56
            replySenderLabel.text = msg.senderName ?? (msg.isMine ? "You" : "Message")
            if let t = msg.text, !t.isEmpty {
                replyTextLabel.text = t
            } else if msg.hasImages {
                replyTextLabel.text = "🖼 Photo"
            } else {
                replyTextLabel.text = "Message"
            }
        } else {
            replyPanel.isHidden = true
            replyPanelHeightConstraint.constant = 0
        }
        UIView.animate(withDuration: 0.2) { self.layoutIfNeeded() }
        let total = textViewHeightConstraint.constant + 16 + (replyToMessage != nil ? 56 : 0)
        delegate?.inputBar(self, didChangeHeight: total)
    }

    // MARK: - Helpers

    private func updatePlaceholder() {
        placeholderLabel.isHidden = !textView.text.isEmpty
    }

    private func updateSendButton() {
        let hasText = !textView.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        UIView.animate(withDuration: 0.2) {
            self.sendButton.alpha = hasText ? 1.0 : 0.5
            self.sendButton.isEnabled = hasText
        }
    }

    private func updateHeight() {
        let size = textView.sizeThatFits(CGSize(width: textView.bounds.width, height: .greatestFiniteMagnitude))
        let newHeight = min(max(size.height, minHeight), maxHeight)
        guard textViewHeightConstraint.constant != newHeight else { return }
        textViewHeightConstraint.constant = newHeight
        textView.isScrollEnabled = newHeight >= maxHeight
        UIView.animate(withDuration: 0.2) { self.layoutIfNeeded() }
        let replyH: CGFloat = replyToMessage != nil ? 56 : 0
        delegate?.inputBar(self, didChangeHeight: newHeight + 16 + replyH)
    }

    func clearText() {
        textView.text = ""
        replyToMessage = nil
        updatePlaceholder()
        updateSendButton()
        updateHeight()
    }
}

// MARK: - UITextViewDelegate

extension InputBarView: UITextViewDelegate {
    func textViewDidChange(_ textView: UITextView) {
        updatePlaceholder()
        updateSendButton()
        updateHeight()
    }

    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
        if text == "\n" {
            let trimmed = textView.text.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty { sendTapped(); return false }
        }
        return true
    }
}

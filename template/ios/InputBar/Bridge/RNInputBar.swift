import IOSChatView
import UIKit
import React

final class RNInputBar: UIView {

    // MARK: - Event Handlers

    @objc var onSendMessage: RCTDirectEventBlock?
    @objc var onEditMessage: RCTDirectEventBlock?
    @objc var onCancelInputAction: RCTDirectEventBlock?
    @objc var onAttachmentPress: RCTDirectEventBlock?
    @objc var onVoiceRecordingComplete: RCTDirectEventBlock?
    @objc var onInputTyping: RCTDirectEventBlock?
    @objc var onRecordingStateChange: RCTDirectEventBlock?

    // MARK: - Props

    @objc var theme: NSString = "light" {
        didSet { applyCurrentTheme() }
    }

    @objc var placeholder: NSString? {
        didSet {
            if let text = placeholder as? String {
                inputBar.placeholder = text
            }
        }
    }

    @objc var inputAction: NSDictionary? {
        didSet { applyInputAction() }
    }

    // MARK: - Internal

    private let inputBar = InputBarView()
    private var isSetup = false

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        guard !isSetup else { return }
        isSetup = true

        inputBar.delegate = self
        inputBar.translatesAutoresizingMaskIntoConstraints = false
        addSubview(inputBar)

        NSLayoutConstraint.activate([
            inputBar.topAnchor.constraint(equalTo: topAnchor),
            inputBar.leadingAnchor.constraint(equalTo: leadingAnchor),
            inputBar.trailingAnchor.constraint(equalTo: trailingAnchor),
            inputBar.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])

        applyCurrentTheme()
    }

    // MARK: - Theme

    private func applyCurrentTheme() {
        let barTheme: InputBarTheme = (theme == "dark") ? .dark : .light
        inputBar.applyTheme(barTheme)
    }

    // MARK: - Commands

    func clearInput() {
        inputBar.clearInput()
    }

    func focus() {
        inputBar.activateKeyboard()
    }

    func blur() {
        inputBar.dismissKeyboard()
    }

    // MARK: - Input Action

    private func applyInputAction() {
        guard let dict = inputAction else {
            inputBar.cancelMode()
            return
        }
        let type = dict["type"] as? String ?? "none"

        switch type {
        case "reply":
            let info = InputBarReplyInfo(
                messageId: dict["messageId"] as? String ?? "",
                senderName: dict["senderName"] as? String,
                text: dict["text"] as? String,
                hasImage: dict["hasImage"] as? Bool ?? false
            )
            inputBar.beginReply(info: info)
        case "edit":
            let messageId = dict["messageId"] as? String ?? ""
            let text = dict["text"] as? String ?? ""
            inputBar.beginEdit(messageId: messageId, text: text)
        default:
            inputBar.cancelMode()
        }
    }

    // MARK: - Intrinsic Size

    override var intrinsicContentSize: CGSize {
        inputBar.intrinsicContentSize
    }
}

// MARK: - InputBarDelegate

extension RNInputBar: InputBarDelegate {
    func inputBarDidSend(text: String, replyToId: String?) {
        var data: [String: Any] = ["text": text]
        if let id = replyToId { data["replyToId"] = id }
        onSendMessage?(data)
    }

    func inputBarDidEdit(text: String, messageId: String) {
        onEditMessage?(["text": text, "messageId": messageId])
    }

    func inputBarDidCancelMode(type: String) {
        onCancelInputAction?(["type": type])
    }

    func inputBarDidTapAttachment() {
        onAttachmentPress?([:])
    }

    func inputBarDidCompleteVoiceRecording(fileURL: URL, duration: TimeInterval, waveform: [Float]) {
        onVoiceRecordingComplete?([
            "fileUrl": fileURL.absoluteString,
            "duration": duration,
            "waveform": waveform.map { Double($0) },
        ])
    }

    func inputBarDidChangeText(_ text: String) {
        onInputTyping?(["text": text])
    }

    func inputBarRecordingStateChanged(isRecording: Bool) {
        onRecordingStateChange?(["isRecording": isRecording])
    }
}

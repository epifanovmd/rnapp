// MARK: - ReplyPreviewView.swift
// Блок цитаты внутри пузыря сообщения.
// Отображает имя автора оригинала и превью текста/фото.
// Используется в MessageBubbleView (входящие и исходящие).
// Также переиспользуется в InputBarView для панели ответа.

import UIKit

final class ReplyPreviewView: UIView {

    // MARK: - Subviews

    private let accentBar: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.layer.cornerRadius = 1.5
        return v
    }()

    private let senderLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 12, weight: .semibold)
        l.translatesAutoresizingMaskIntoConstraints = false
        l.numberOfLines = 1
        return l
    }()

    private let contentLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 12)
        l.translatesAutoresizingMaskIntoConstraints = false
        l.numberOfLines = 2
        return l
    }()

    // MARK: - Callbacks

    var onTap: (() -> Void)?

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        layer.cornerRadius  = 8
        layer.masksToBounds = true
        addSubview(accentBar)
        addSubview(senderLabel)
        addSubview(contentLabel)

        NSLayoutConstraint.activate([
            accentBar.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 6),
            accentBar.topAnchor.constraint(equalTo: topAnchor, constant: 5),
            accentBar.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -5),
            accentBar.widthAnchor.constraint(equalToConstant: 3),

            senderLabel.leadingAnchor.constraint(equalTo: accentBar.trailingAnchor, constant: 6),
            senderLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -8),
            senderLabel.topAnchor.constraint(equalTo: topAnchor, constant: 5),

            contentLabel.leadingAnchor.constraint(equalTo: senderLabel.leadingAnchor),
            contentLabel.trailingAnchor.constraint(equalTo: senderLabel.trailingAnchor),
            contentLabel.topAnchor.constraint(equalTo: senderLabel.bottomAnchor, constant: 1),
            contentLabel.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -5),
        ])

        addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(handleTap)))
        isUserInteractionEnabled = true
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Configure

    /// Заполняет view данными из ReplyInfo и применяет цвета темы.
    /// `isMine` определяет набор цветов (внутри исходящего или входящего пузыря).
    func configure(with reply: ReplyInfo, isMine: Bool, theme: ChatTheme) {
        senderLabel.text  = reply.senderName ?? "Message"
        contentLabel.text = previewText(from: reply)
        applyColors(isMine: isMine, theme: theme)
    }

    // MARK: - Private helpers

    /// Строит строку превью: текст, «📷 Photo», или «Message» как fallback.
    private func previewText(from reply: ReplyInfo) -> String {
        if let t = reply.text, !t.isEmpty { return t }
        if reply.hasImage { return "📷 Photo" }
        return "Message"
    }

    /// Применяет цвета в зависимости от типа пузыря и темы.
    private func applyColors(isMine: Bool, theme: ChatTheme) {
        if isMine {
            backgroundColor       = theme.outgoingReplyBackground
            accentBar.backgroundColor = theme.outgoingReplyAccent
            senderLabel.textColor  = theme.outgoingReplySender
            contentLabel.textColor = theme.outgoingReplyText
        } else {
            backgroundColor       = theme.incomingReplyBackground
            accentBar.backgroundColor = theme.incomingReplyAccent
            senderLabel.textColor  = theme.incomingReplySender
            contentLabel.textColor = theme.incomingReplyText
        }
    }

    @objc private func handleTap() { onTap?() }
}

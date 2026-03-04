// MARK: - TextContentView.swift
// Рендерер текстового сообщения (content == .text).

import UIKit

final class TextContentView: UIView, MessageContentView {

    private let label: UILabel = {
        let l = UILabel()
        l.numberOfLines = 0
        l.font = ChatLayoutConstants.messageFont
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        addSubview(label)
        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: topAnchor),
            label.bottomAnchor.constraint(equalTo: bottomAnchor),
            label.leadingAnchor.constraint(equalTo: leadingAnchor),
            label.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }
    required init?(coder: NSCoder) { fatalError() }

    func configure(content: MessageContent, isMine: Bool) {
        label.text      = content.text
        label.textColor = isMine ? .white : .label
    }

    func applyLayout(bubbleWidth: CGFloat) {}
}

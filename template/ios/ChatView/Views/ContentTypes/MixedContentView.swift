// MARK: - MixedContentView.swift
// Рендерер сообщения с изображениями И текстом (content == .mixed).

import UIKit

final class MixedContentView: UIView, MessageContentView {

    private let imagesView = ImagesContentView()
    private let textView   = TextContentView()

    private let stack: UIStackView = {
        let sv = UIStackView()
        sv.axis    = .vertical
        sv.spacing = ChatLayoutConstants.stackSpacing
        sv.translatesAutoresizingMaskIntoConstraints = false
        return sv
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        addSubview(stack)
        stack.addArrangedSubview(imagesView)
        stack.addArrangedSubview(textView)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }
    required init?(coder: NSCoder) { fatalError() }

    func configure(content: MessageContent, isMine: Bool) {
        imagesView.configure(content: content, isMine: isMine)
        textView.configure(content: content, isMine: isMine)
    }

    func applyLayout(bubbleWidth: CGFloat) {
        imagesView.applyLayout(bubbleWidth: bubbleWidth)
        textView.applyLayout(bubbleWidth: bubbleWidth)
    }

    func cancelAsync() {
        imagesView.cancelAsync()
    }
}

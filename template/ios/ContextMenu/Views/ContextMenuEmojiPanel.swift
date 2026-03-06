// MARK: - ContextMenuEmojiPanel.swift
// Горизонтальная панель с кнопками-эмодзи.
// Отображается над preview сообщения, аналогично Telegram/WhatsApp.

import UIKit

// MARK: - ContextMenuEmojiPanel

final class ContextMenuEmojiPanel: UIView {

    // MARK: - Callback

    var onEmojiTap: ((String) -> Void)?

    // MARK: - Private

    private let theme: ContextMenuTheme
    private let stackView: UIStackView = {
        let sv = UIStackView()
        sv.axis         = .horizontal
        sv.alignment    = .center
        sv.distribution = .equalSpacing
        sv.translatesAutoresizingMaskIntoConstraints = false
        return sv
    }()

    // MARK: - Init

    init(theme: ContextMenuTheme) {
        self.theme = theme
        super.init(frame: .zero)
        setupView()
    }

    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Setup

    private func setupView() {
        backgroundColor    = theme.emojiPanelBackground
        layer.cornerRadius = theme.emojiPanelCornerRadius
        layer.cornerCurve  = .continuous

        layer.shadowColor   = theme.emojiPanelShadowColor.cgColor
        layer.shadowOpacity = theme.emojiPanelShadowOpacity
        layer.shadowRadius  = theme.emojiPanelShadowRadius
        layer.shadowOffset  = CGSize(width: 0, height: 4)

        addSubview(stackView)

        let padding: CGFloat = 10
        NSLayoutConstraint.activate([
            stackView.topAnchor.constraint(equalTo: topAnchor, constant: padding),
            stackView.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -padding),
            stackView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: padding),
            stackView.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -padding),
        ])
    }

    // MARK: - Configure

    func configure(with emojis: [ContextMenuEmoji]) {
        stackView.arrangedSubviews.forEach { $0.removeFromSuperview() }

        for emojiItem in emojis {
            let btn = makeEmojiButton(emoji: emojiItem.emoji)
            stackView.addArrangedSubview(btn)
        }
    }

    // MARK: - Private

    private func makeEmojiButton(emoji: String) -> UIButton {
        let btn = UIButton(type: .custom)
        btn.setTitle(emoji, for: .normal)
        btn.titleLabel?.font = .systemFont(ofSize: theme.emojiFontSize)
        btn.translatesAutoresizingMaskIntoConstraints = false

        NSLayoutConstraint.activate([
            btn.widthAnchor.constraint(equalToConstant: theme.emojiItemSize),
            btn.heightAnchor.constraint(equalToConstant: theme.emojiItemSize),
        ])

        btn.addTarget(self, action: #selector(emojiTapped(_:)), for: .touchUpInside)

        // Scale animation on tap
        btn.addTarget(self, action: #selector(emojiTouchDown(_:)), for: .touchDown)
        btn.addTarget(self, action: #selector(emojiTouchUp(_:)), for: [.touchUpInside, .touchUpOutside, .touchCancel])

        return btn
    }

    @objc private func emojiTapped(_ sender: UIButton) {
        guard let emoji = sender.title(for: .normal) else { return }
        onEmojiTap?(emoji)
    }

    @objc private func emojiTouchDown(_ sender: UIButton) {
        UIView.animate(
            withDuration: 0.10,
            delay: 0,
            options: [.curveEaseInOut, .allowUserInteraction]
        ) {
            sender.transform = CGAffineTransform(scaleX: 0.80, y: 0.80)
        }
    }

    @objc private func emojiTouchUp(_ sender: UIButton) {
        UIView.animate(
            withDuration: 0.20,
            delay: 0,
            usingSpringWithDamping: 0.5,
            initialSpringVelocity: 0.8,
            options: [.allowUserInteraction]
        ) {
            sender.transform = .identity
        }
    }

    // MARK: - Preferred size

    func preferredSize(for emojis: [ContextMenuEmoji]) -> CGSize {
        let count  = CGFloat(emojis.count)
        let vPad   = CGFloat(10 * 2)
        let hPad   = CGFloat(10 * 2)
        let width  = count * theme.emojiItemSize + hPad
        let height = theme.emojiItemSize + vPad
        return CGSize(width: width, height: height)
    }
}

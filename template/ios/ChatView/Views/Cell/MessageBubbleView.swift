// MARK: - MessageBubbleView.swift
//
// Компоновка пузыря: [цитата] → [контент] → [footer].
// contentView создаётся через фабрику и заменяется только при смене типа —
// при переиспользовании ячейки нет лишних alloc.

import UIKit

final class MessageBubbleView: UIView {

    // MARK: - Subviews

    let replyPreview = ReplyPreviewView()

    private var contentView: (any MessageContentView)?

    private let timeLabel: UILabel = {
        let l = UILabel()
        l.font = ChatLayoutConstants.footerFont
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()
    private let statusView: MessageStatusView = {
        let v = MessageStatusView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()
    private let footerStack: UIStackView = {
        let sv = UIStackView()
        sv.axis      = .horizontal
        sv.spacing   = ChatLayoutConstants.footerInternalSpacing
        sv.alignment = .center
        sv.translatesAutoresizingMaskIntoConstraints = false
        return sv
    }()
    private let mainStack: UIStackView = {
        let sv = UIStackView()
        sv.axis    = .vertical
        sv.spacing = ChatLayoutConstants.stackSpacing
        sv.translatesAutoresizingMaskIntoConstraints = false
        return sv
    }()

    // MARK: - Bubble color (нужен ячейке для highlight → restore)

    /// Актуальный цвет фона пузыря. Читается из MessageCell.highlight().
    var bubbleColor: UIColor? { backgroundColor }

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        layer.cornerRadius = ChatLayoutConstants.bubbleCornerRadius
        clipsToBounds = true

        statusView.widthAnchor.constraint(equalToConstant: ChatLayoutConstants.statusIconWidth).isActive  = true
        statusView.heightAnchor.constraint(equalToConstant: 12).isActive = true

        footerStack.addArrangedSubview(timeLabel)
        footerStack.addArrangedSubview(statusView)

        replyPreview.translatesAutoresizingMaskIntoConstraints = false
        mainStack.addArrangedSubview(replyPreview)

        addSubview(mainStack)
        addSubview(footerStack)

        let C = ChatLayoutConstants.self
        let hp = C.bubbleHorizontalPad / 2
        NSLayoutConstraint.activate([
            mainStack.topAnchor.constraint(equalTo: topAnchor, constant: C.bubbleTopPad),
            mainStack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: hp),
            mainStack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -hp),

            footerStack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -C.footerTrailingPad),
            footerStack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -C.bubbleBottomPad),
            footerStack.topAnchor.constraint(equalTo: mainStack.bottomAnchor, constant: C.footerTopSpacing),
        ])
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Configure

    func configure(with message: ChatMessage, resolvedReply: ResolvedReply?) {
        let isMine = message.isMine

        backgroundColor = isMine
            ? UIColor(red: 0.24, green: 0.62, blue: 0.98, alpha: 1)
            : UIColor(white: 0.94, alpha: 1)
        timeLabel.textColor = isMine ? UIColor.white.withAlphaComponent(0.75) : .secondaryLabel

        // Цитата
        switch resolvedReply {
        case .found(let snap):
            replyPreview.isHidden = false
            replyPreview.configure(with: snap, isMine: isMine)
        case .deleted, nil:
            replyPreview.isHidden = true
        }

        // Контент — пересоздаём только при смене типа
        if !MessageContentViewFactory.matches(contentView, content: message.content) {
            contentView?.removeFromSuperview()
            let cv = MessageContentViewFactory.make(for: message.content)
            (cv as UIView).translatesAutoresizingMaskIntoConstraints = false
            mainStack.addArrangedSubview(cv as UIView)
            contentView = cv
        }
        contentView?.configure(content: message.content, isMine: isMine)

        timeLabel.text = DateHelper.shared.timeString(from: message.timestamp)
        statusView.configure(status: message.status, isMine: isMine)
    }

    func applyLayout(bubbleWidth: CGFloat) {
        contentView?.applyLayout(bubbleWidth: bubbleWidth)
    }

    /// Проксирует cancelAsync() к contentView (загрузка изображений).
    func cancelAsync() {
        contentView?.cancelAsync()
    }
}

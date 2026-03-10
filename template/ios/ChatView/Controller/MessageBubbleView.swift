// MARK: - MessageBubbleView.swift
// Компоновка пузыря: цитата (опционально) → контент → footer.
// Конкретный рендерер контента создаётся через фабрику и заменяется
// только при смене типа — при переиспользовании ячеек нет лишних alloc.

import UIKit

final class MessageBubbleView: UIView {

    // MARK: - Subviews

    let replyPreview = ReplyPreviewView()

    private var contentView: (any MessageContentView)?

    private let editedLabel: UILabel = {
        let l = UILabel()
        l.font = ChatLayoutConstants.footerFont
        l.text = NSLocalizedString(
            "chat.bubble.edited",
            value: "edited",
            comment: "Short label shown in message footer when a message has been edited"
        )
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

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

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupLayout()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented — use init(frame:)")
    }

    // MARK: - Setup

    private func setupLayout() {
        layer.cornerRadius = ChatLayoutConstants.bubbleCornerRadius
        clipsToBounds      = true

        statusView.widthAnchor.constraint(
            equalToConstant: ChatLayoutConstants.statusIconWidth).isActive  = true
        statusView.heightAnchor.constraint(
            equalToConstant: ChatLayoutConstants.statusIconHeight).isActive = true

        // Порядок в footerStack: edited → time → status
        footerStack.addArrangedSubview(editedLabel)
        footerStack.addArrangedSubview(timeLabel)
        footerStack.addArrangedSubview(statusView)

        replyPreview.translatesAutoresizingMaskIntoConstraints = false
        mainStack.addArrangedSubview(replyPreview)

        addSubview(mainStack)
        addSubview(footerStack)

        let C = ChatLayoutConstants.self
        NSLayoutConstraint.activate([
            mainStack.topAnchor.constraint(equalTo: topAnchor, constant: C.bubbleTopPad),
            mainStack.leadingAnchor.constraint(equalTo: leadingAnchor,
                constant: C.bubbleHorizontalPad / 2),
            mainStack.trailingAnchor.constraint(equalTo: trailingAnchor,
                constant: -C.bubbleHorizontalPad / 2),

            footerStack.trailingAnchor.constraint(equalTo: trailingAnchor,
                constant: -C.footerTrailingPad),
            footerStack.bottomAnchor.constraint(equalTo: bottomAnchor,
                constant: -C.bubbleBottomPad),
            footerStack.topAnchor.constraint(equalTo: mainStack.bottomAnchor,
                constant: C.footerTopSpacing),
        ])
    }

    // MARK: - Configure

    /// Заполняет пузырь данными сообщения и применяет тему.
    func configure(with message: ChatMessage, resolvedReply: ResolvedReply?, theme: ChatTheme) {
        let isMine = message.isMine
        applyBubbleColors(isMine: isMine, theme: theme)
        configureReply(resolvedReply: resolvedReply, isMine: isMine, theme: theme)
        configureContent(message: message, isMine: isMine, theme: theme)
        configureFooter(message: message, isMine: isMine, theme: theme)
    }

    /// Применяет финальную ширину пузыря к контенту (изображения).
    func applyLayout(bubbleWidth: CGFloat) {
        contentView?.applyLayout(bubbleWidth: bubbleWidth)
    }

    /// Сбрасывает состояние contentView перед переиспользованием ячейки.
    func prepareForReuse() {
        contentView?.prepareForReuse()
    }

    // MARK: - Private helpers

    private func applyBubbleColors(isMine: Bool, theme: ChatTheme) {
        backgroundColor = isMine ? theme.outgoingBubbleColor : theme.incomingBubbleColor
    }

    /// Показывает/скрывает replyPreview в зависимости от результата резолвинга.
    private func configureReply(
        resolvedReply: ResolvedReply?,
        isMine: Bool,
        theme: ChatTheme
    ) {
        switch resolvedReply {
        case .found(let displayInfo):
            replyPreview.isHidden = false
            replyPreview.configure(with: displayInfo, isMine: isMine, theme: theme)
        case .deleted, nil:
            replyPreview.isHidden = true
        }
    }

    /// Создаёт новый рендерер контента только при смене типа; иначе переиспользует.
    private func configureContent(message: ChatMessage, isMine: Bool, theme: ChatTheme) {
        if !MessageContentViewFactory.matches(contentView, content: message.content) {
            contentView?.removeFromSuperview()
            let cv = MessageContentViewFactory.make(for: message.content)
            (cv as UIView).translatesAutoresizingMaskIntoConstraints = false
            mainStack.insertArrangedSubview(cv as UIView, at: mainStack.arrangedSubviews.count)
            contentView = cv
        }
        contentView?.configure(content: message.content, isMine: isMine, theme: theme)
    }

    private func configureFooter(message: ChatMessage, isMine: Bool, theme: ChatTheme) {
        timeLabel.text      = DateHelper.shared.timeString(from: message.timestamp)
        timeLabel.textColor = isMine ? theme.outgoingTimeColor : theme.incomingTimeColor

        statusView.configure(status: message.status, isMine: isMine, theme: theme)

        editedLabel.isHidden  = !message.isEdited
        editedLabel.textColor = isMine ? theme.outgoingEditedColor : theme.incomingEditedColor
    }
}

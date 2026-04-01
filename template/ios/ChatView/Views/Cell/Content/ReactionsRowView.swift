// MARK: - ReactionsRowView.swift
// Telegram-style horizontal reaction chips below the message bubble.

import UIKit

final class ReactionsRowView: UIView {

    private var chipViews: [ReactionChipView] = []

    private let flowContainer: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        addSubview(flowContainer)
        NSLayoutConstraint.activate([
            flowContainer.topAnchor.constraint(equalTo: topAnchor),
            flowContainer.bottomAnchor.constraint(equalTo: bottomAnchor),
            flowContainer.leadingAnchor.constraint(equalTo: leadingAnchor),
            flowContainer.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented — use init(frame:)")
    }

    func configure(reactions: [Reaction], isMine: Bool, theme: ChatTheme) {
        prepareForReuse()

        var x: CGFloat = 0
        let spacing: CGFloat = 4
        let chipHeight: CGFloat = 26

        for reaction in reactions {
            let chip = ReactionChipView()
            chip.configure(reaction: reaction, isMine: isMine, theme: theme)
            let chipWidth = chip.intrinsicContentSize.width
            chip.frame = CGRect(x: x, y: 0, width: chipWidth, height: chipHeight)
            flowContainer.addSubview(chip)
            chipViews.append(chip)
            x += chipWidth + spacing
        }

        let totalHeight = reactions.isEmpty ? 0 : chipHeight
        let heightConstraint = flowContainer.heightAnchor.constraint(equalToConstant: totalHeight)
        heightConstraint.priority = .defaultHigh
        heightConstraint.isActive = true
    }

    func prepareForReuse() {
        chipViews.forEach { $0.removeFromSuperview() }
        chipViews.removeAll()
        flowContainer.constraints
            .filter { $0.firstAttribute == .height }
            .forEach { $0.isActive = false }
    }

    override var intrinsicContentSize: CGSize {
        let w = chipViews.last.map { $0.frame.maxX } ?? 0
        let h: CGFloat = chipViews.isEmpty ? 0 : 26
        return CGSize(width: w, height: h)
    }
}

// MARK: - ReactionChipView

private final class ReactionChipView: UIView {

    private let emojiLabel: UILabel = {
        let l = UILabel()
        l.font = UIFont.systemFont(ofSize: 14)
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let countLabel: UILabel = {
        let l = UILabel()
        l.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        layer.cornerRadius = 13
        clipsToBounds = true

        addSubview(emojiLabel)
        addSubview(countLabel)

        NSLayoutConstraint.activate([
            emojiLabel.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 6),
            emojiLabel.centerYAnchor.constraint(equalTo: centerYAnchor),

            countLabel.leadingAnchor.constraint(equalTo: emojiLabel.trailingAnchor, constant: 2),
            countLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -6),
            countLabel.centerYAnchor.constraint(equalTo: centerYAnchor),
        ])
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented — use init(frame:)")
    }

    func configure(reaction: Reaction, isMine: Bool, theme: ChatTheme) {
        emojiLabel.text = reaction.emoji
        countLabel.text = "\(reaction.count)"

        if reaction.isMine {
            backgroundColor = (isMine ? theme.outgoingReplyAccent : theme.incomingReplyAccent).withAlphaComponent(0.2)
            countLabel.textColor = isMine ? theme.outgoingTextColor : theme.incomingReplyAccent
        } else {
            backgroundColor = (isMine ? UIColor.white : UIColor.black).withAlphaComponent(0.08)
            countLabel.textColor = isMine ? theme.outgoingTextColor : theme.incomingTextColor
        }
    }

    override var intrinsicContentSize: CGSize {
        let emojiW = emojiLabel.intrinsicContentSize.width
        let countW = countLabel.intrinsicContentSize.width
        return CGSize(width: 6 + emojiW + 2 + countW + 6, height: 26)
    }
}

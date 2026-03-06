// MARK: - ContextMenuActionsView.swift

import UIKit

// MARK: - ContextMenuActionsView

final class ContextMenuActionsView: UIView {

    var onActionTap: ((ContextMenuAction) -> Void)?

    private let theme: ContextMenuTheme
    private var actions: [ContextMenuAction] = []

    init(theme: ContextMenuTheme) {
        self.theme = theme
        super.init(frame: .zero)
        backgroundColor    = theme.menuBackground
        layer.cornerRadius = theme.menuCornerRadius
        layer.cornerCurve  = .continuous
        layer.masksToBounds = true
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Configure

    func configure(with actions: [ContextMenuAction]) {
        self.actions = actions
        subviews.forEach { $0.removeFromSuperview() }

        for (index, action) in actions.enumerated() {
            let row = ActionRowView(action: action, theme: theme)
            row.onTap = { [weak self] in self?.onActionTap?(action) }
            addSubview(row)

            if index < actions.count - 1 {
                let sep = UIView()
                sep.backgroundColor = theme.menuSeparatorColor
                sep.tag = 999
                addSubview(sep)
            }
        }
        setNeedsLayout()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        guard !actions.isEmpty else { return }

        let rowH = theme.actionItemHeight
        let sepH: CGFloat = 0.5
        var y: CGFloat = 0

        var rowIdx = 0
        var sepIdx = 0
        let rows = subviews.filter { $0 is ActionRowView }
        let seps = subviews.filter { $0.tag == 999 }

        for (i, _) in actions.enumerated() {
            if rowIdx < rows.count {
                rows[rowIdx].frame = CGRect(x: 0, y: y, width: bounds.width, height: rowH)
                rowIdx += 1
                y += rowH
            }
            if i < actions.count - 1, sepIdx < seps.count {
                seps[sepIdx].frame = CGRect(x: 0, y: y, width: bounds.width, height: sepH)
                sepIdx += 1
                y += sepH
            }
        }
    }

    func preferredHeight(for actions: [ContextMenuAction]) -> CGFloat {
        CGFloat(actions.count) * theme.actionItemHeight
        + CGFloat(max(0, actions.count - 1)) * 0.5
    }
}

// MARK: - ActionRowView

private final class ActionRowView: UIView {

    var onTap: (() -> Void)?

    private let highlightBg = UIView()
    private var isHighlighted = false

    init(action: ContextMenuAction, theme: ContextMenuTheme) {
        super.init(frame: .zero)

        highlightBg.backgroundColor = theme.actionHighlightColor
        highlightBg.alpha = 0
        highlightBg.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        addSubview(highlightBg)

        let titleLabel = UILabel()
        titleLabel.text      = action.title
        titleLabel.font      = theme.actionTitleFont
        titleLabel.textColor = action.isDestructive
            ? theme.actionDestructiveTitleColor
            : theme.actionTitleColor
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        addSubview(titleLabel)

        let pad = theme.actionHorizontalPadding

        if let sysImage = action.systemImage {
            let config    = UIImage.SymbolConfiguration(pointSize: 15, weight: .regular)
            let iconView  = UIImageView(image: UIImage(systemName: sysImage, withConfiguration: config))
            iconView.tintColor   = action.isDestructive ? theme.actionDestructiveIconColor : theme.actionIconColor
            iconView.contentMode = .scaleAspectFit
            iconView.translatesAutoresizingMaskIntoConstraints = false
            addSubview(iconView)

            NSLayoutConstraint.activate([
                iconView.centerYAnchor.constraint(equalTo: centerYAnchor),
                iconView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: pad),
                iconView.widthAnchor.constraint(equalToConstant: 20),
                iconView.heightAnchor.constraint(equalToConstant: 20),
                titleLabel.centerYAnchor.constraint(equalTo: centerYAnchor),
                titleLabel.leadingAnchor.constraint(equalTo: iconView.trailingAnchor, constant: 10),
                titleLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -pad),
            ])
        } else {
            NSLayoutConstraint.activate([
                titleLabel.centerYAnchor.constraint(equalTo: centerYAnchor),
                titleLabel.leadingAnchor.constraint(equalTo: leadingAnchor, constant: pad),
                titleLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -pad),
            ])
        }
    }
    required init?(coder: NSCoder) { fatalError() }

    override func layoutSubviews() {
        super.layoutSubviews()
        highlightBg.frame = bounds
    }

    // MARK: - Touch handling
    // Используем UITouch напрямую — точно знаем когда палец ушёл за границы

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        setHighlight(true)
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesMoved(touches, with: event)
        guard let touch = touches.first else { return }
        let inside = bounds.contains(touch.location(in: self))
        setHighlight(inside)
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesEnded(touches, with: event)
        guard let touch = touches.first else { setHighlight(false); return }
        let inside = bounds.contains(touch.location(in: self))
        setHighlight(false)
        if inside { onTap?() }
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesCancelled(touches, with: event)
        setHighlight(false)
    }

    private func setHighlight(_ on: Bool) {
        guard isHighlighted != on else { return }
        isHighlighted = on
        UIView.animate(withDuration: on ? 0.08 : 0.18) {
            self.highlightBg.alpha = on ? 1 : 0
        }
    }
}

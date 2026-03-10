// MARK: - DateSeparatorCell.swift
// Sticky-заголовок секции с датой.
// Применяет тему через configure(with:theme:).

import UIKit

final class DateSeparatorView: UICollectionReusableView {

    static let reuseID = "DateSeparatorView"

    // MARK: - Subviews

    private let pillView: UIView = {
        let v = UIView()
        v.layer.cornerRadius = 10
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let label: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 12, weight: .medium)
        l.textAlignment = .center
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
        addSubview(pillView)
        pillView.addSubview(label)
        NSLayoutConstraint.activate([
            pillView.centerXAnchor.constraint(equalTo: centerXAnchor),
            pillView.centerYAnchor.constraint(equalTo: centerYAnchor),
            label.topAnchor.constraint(equalTo: pillView.topAnchor, constant: 5),
            label.bottomAnchor.constraint(equalTo: pillView.bottomAnchor, constant: -5),
            label.leadingAnchor.constraint(equalTo: pillView.leadingAnchor, constant: 10),
            label.trailingAnchor.constraint(equalTo: pillView.trailingAnchor, constant: -10),
        ])
    }
    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Configure

    /// Заполняет текст и применяет цвета из темы.
    func configure(with dateString: String, theme: ChatTheme) {
        label.text                 = dateString
        label.textColor            = theme.dateSeparatorText
        pillView.backgroundColor   = theme.dateSeparatorBackground
    }
}

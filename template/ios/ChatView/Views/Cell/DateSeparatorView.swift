// MARK: - DateSeparatorView.swift
// Sticky section header со скруглённой таблеткой и датой.

import UIKit

final class DateSeparatorView1: UICollectionReusableView {

    static let reuseID = "DateSeparatorView"

    private let pill: UIView = {
        let v = UIView()
        v.backgroundColor    = UIColor.systemGray6.withAlphaComponent(0.88)
        v.layer.cornerRadius = 10
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let label: UILabel = {
        let l = UILabel()
        l.font          = .systemFont(ofSize: 12, weight: .medium)
        l.textColor     = .secondaryLabel
        l.textAlignment = .center
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
        addSubview(pill)
        pill.addSubview(label)
        NSLayoutConstraint.activate([
            pill.centerXAnchor.constraint(equalTo: centerXAnchor),
            pill.centerYAnchor.constraint(equalTo: centerYAnchor),
            label.topAnchor.constraint(equalTo: pill.topAnchor, constant: 5),
            label.bottomAnchor.constraint(equalTo: pill.bottomAnchor, constant: -5),
            label.leadingAnchor.constraint(equalTo: pill.leadingAnchor, constant: 10),
            label.trailingAnchor.constraint(equalTo: pill.trailingAnchor, constant: -10),
        ])
    }
    required init?(coder: NSCoder) { fatalError() }

    func configure(with dateString: String) { label.text = dateString }
}

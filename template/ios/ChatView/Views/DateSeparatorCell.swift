// MARK: - DateSeparatorCell.swift
// Sticky date header for chat sections

import UIKit

final class DateSeparatorView1: UICollectionReusableView {
    static let reuseID = "DateSeparatorView"

    private let pillView: UIView = {
        let v = UIView()
        v.backgroundColor = UIColor.systemGray6.withAlphaComponent(0.85)
        v.layer.cornerRadius = 10
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let label: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 12, weight: .medium)
        l.textColor = .secondaryLabel
        l.textAlignment = .center
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

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

    func configure(with dateString: String) {
        label.text = dateString
    }
}

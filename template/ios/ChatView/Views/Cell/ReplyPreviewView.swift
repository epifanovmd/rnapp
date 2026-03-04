// MARK: - ReplyPreviewView.swift

import UIKit

final class ReplyPreviewView: UIView {

    private let accentBar: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        v.layer.cornerRadius = 1.5
        return v
    }()
    private let senderLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 12, weight: .semibold)
        l.translatesAutoresizingMaskIntoConstraints = false
        l.numberOfLines = 1
        return l
    }()
    private let contentLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 12)
        l.translatesAutoresizingMaskIntoConstraints = false
        l.numberOfLines = 2
        return l
    }()

    var onTap: (() -> Void)?

    override init(frame: CGRect) {
        super.init(frame: frame)
        layer.cornerRadius  = 8
        layer.masksToBounds = true
        addSubview(accentBar); addSubview(senderLabel); addSubview(contentLabel)

        NSLayoutConstraint.activate([
            accentBar.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 6),
            accentBar.topAnchor.constraint(equalTo: topAnchor, constant: 5),
            accentBar.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -5),
            accentBar.widthAnchor.constraint(equalToConstant: 3),

            senderLabel.leadingAnchor.constraint(equalTo: accentBar.trailingAnchor, constant: 6),
            senderLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -8),
            senderLabel.topAnchor.constraint(equalTo: topAnchor, constant: 5),

            contentLabel.leadingAnchor.constraint(equalTo: senderLabel.leadingAnchor),
            contentLabel.trailingAnchor.constraint(equalTo: senderLabel.trailingAnchor),
            contentLabel.topAnchor.constraint(equalTo: senderLabel.bottomAnchor, constant: 1),
            contentLabel.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -5),
        ])

        addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(tapped)))
        isUserInteractionEnabled = true
    }
    required init?(coder: NSCoder) { fatalError() }

    @objc private func tapped() { onTap?() }

    func configure(with snap: ResolvedReply.Snapshot, isMine: Bool) {
        senderLabel.text  = snap.senderName ?? "Сообщение"
        contentLabel.text = snap.text.flatMap { $0.isEmpty ? nil : $0 }
            ?? (snap.hasImages ? "🖼 Фото" : "Сообщение")

        if isMine {
            backgroundColor       = UIColor.white.withAlphaComponent(0.20)
            accentBar.backgroundColor = UIColor.white.withAlphaComponent(0.70)
            senderLabel.textColor  = UIColor.white.withAlphaComponent(0.90)
            contentLabel.textColor = UIColor.white.withAlphaComponent(0.85)
        } else {
            backgroundColor       = UIColor.black.withAlphaComponent(0.06)
            accentBar.backgroundColor = .systemBlue
            senderLabel.textColor  = .systemBlue
            contentLabel.textColor = .secondaryLabel
        }
    }
}

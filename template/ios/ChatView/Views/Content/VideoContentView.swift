import UIKit

final class VideoContentView: UIView {
    var onTap: (() -> Void)?

    private let thumbnail = UIImageView()
    private let playButton = UIImageView()
    private let durationLabel = UILabel()
    private let durationBg = UIView()
    private var heightConstraint: NSLayoutConstraint?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        thumbnail.contentMode = .scaleAspectFill
        thumbnail.clipsToBounds = true
        thumbnail.layer.cornerRadius = ChatLayout.imageCornerRadius
        thumbnail.backgroundColor = UIColor(white: 0.9, alpha: 1)
        thumbnail.translatesAutoresizingMaskIntoConstraints = false
        addSubview(thumbnail)

        let config = UIImage.SymbolConfiguration(pointSize: 24, weight: .regular)
        playButton.image = UIImage(systemName: "play.circle.fill", withConfiguration: config)
        playButton.tintColor = .white
        playButton.translatesAutoresizingMaskIntoConstraints = false
        playButton.layer.shadowColor = UIColor.black.cgColor
        playButton.layer.shadowOpacity = 0.4
        playButton.layer.shadowRadius = 4
        addSubview(playButton)

        durationBg.backgroundColor = UIColor.black.withAlphaComponent(0.5)
        durationBg.layer.cornerRadius = 8
        durationBg.translatesAutoresizingMaskIntoConstraints = false
        addSubview(durationBg)

        durationLabel.font = ChatLayout.videoDurationFont
        durationLabel.textColor = .white
        durationLabel.translatesAutoresizingMaskIntoConstraints = false
        durationBg.addSubview(durationLabel)

        NSLayoutConstraint.activate([
            thumbnail.topAnchor.constraint(equalTo: topAnchor),
            thumbnail.leadingAnchor.constraint(equalTo: leadingAnchor),
            thumbnail.trailingAnchor.constraint(equalTo: trailingAnchor),
            thumbnail.bottomAnchor.constraint(equalTo: bottomAnchor),
            playButton.centerXAnchor.constraint(equalTo: thumbnail.centerXAnchor),
            playButton.centerYAnchor.constraint(equalTo: thumbnail.centerYAnchor),
            playButton.widthAnchor.constraint(equalToConstant: ChatLayout.videoPlaySize),
            playButton.heightAnchor.constraint(equalToConstant: ChatLayout.videoPlaySize),
            durationBg.trailingAnchor.constraint(equalTo: thumbnail.trailingAnchor, constant: -6),
            durationBg.bottomAnchor.constraint(equalTo: thumbnail.bottomAnchor, constant: -6),
            durationLabel.topAnchor.constraint(equalTo: durationBg.topAnchor, constant: 2),
            durationLabel.bottomAnchor.constraint(equalTo: durationBg.bottomAnchor, constant: -2),
            durationLabel.leadingAnchor.constraint(equalTo: durationBg.leadingAnchor, constant: 6),
            durationLabel.trailingAnchor.constraint(equalTo: durationBg.trailingAnchor, constant: -6),
        ])

        let tap = UITapGestureRecognizer(target: self, action: #selector(tapped))
        addGestureRecognizer(tap)
    }

    func configure(video: VideoPayload, width: CGFloat, theme: ChatTheme) {
        let h = MessageSizeCalculator.videoHeight(video, width: width)
        heightConstraint?.isActive = false
        heightConstraint = thumbnail.heightAnchor.constraint(equalToConstant: h)
        heightConstraint?.priority = .defaultHigh
        heightConstraint?.isActive = true

        thumbnail.loadChatImage(url: video.thumbnailUrl)

        if let dur = video.duration {
            let mins = Int(dur) / 60
            let secs = Int(dur) % 60
            durationLabel.text = String(format: "%d:%02d", mins, secs)
            durationBg.isHidden = false
        } else {
            durationBg.isHidden = true
        }
    }

    @objc private func tapped() { onTap?() }
}

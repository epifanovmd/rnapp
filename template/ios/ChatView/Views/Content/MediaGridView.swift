import UIKit

final class MediaGridView: UIView {

    var onItemTap: ((Int) -> Void)?

    private let spacing: CGFloat = 2
    private let maxVisible = 4
    private var cellViews: [MediaCellView] = []
    private var heightConstraint: NSLayoutConstraint?

    override init(frame: CGRect) {
        super.init(frame: frame)
        clipsToBounds = true
        layer.cornerRadius = ChatLayout.imageCornerRadius

        isUserInteractionEnabled = true
    }

    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Configure

    func configure(media: [MediaItem], width: CGFloat) {
        cellViews.forEach { $0.removeFromSuperview() }
        cellViews.removeAll()

        let count = media.count
        guard count > 0 else { return }

        let visibleCount = min(count, maxVisible)
        let totalH = MediaGridView.gridHeight(for: media, width: width)

        heightConstraint?.isActive = false
        heightConstraint = heightAnchor.constraint(equalToConstant: totalH)
        heightConstraint?.priority = .defaultHigh
        heightConstraint?.isActive = true

        let frames = layoutFrames(count: visibleCount, width: width, height: totalH)

        for i in 0..<visibleCount {
            let item = media[i]
            let cell = MediaCellView()
            cell.configure(item: item)

            // "+N" overlay on last cell if more items
            if i == visibleCount - 1 && count > maxVisible {
                cell.showOverlay(remaining: count - maxVisible)
            }

            cell.frame = frames[i]
            cell.tag = i
            let tap = UITapGestureRecognizer(target: self, action: #selector(cellTapped(_:)))
            cell.addGestureRecognizer(tap)
            addSubview(cell)
            cellViews.append(cell)
        }
    }

    // MARK: - Reuse

    func prepareForReuse() {
        cellViews.forEach { $0.removeFromSuperview() }
        cellViews.removeAll()
        heightConstraint?.isActive = false
    }

    // MARK: - Layout Calculation

    /// Returns the frames for each visible cell
    private func layoutFrames(count: Int, width: CGFloat, height: CGFloat) -> [CGRect] {
        let s = spacing

        switch count {
        case 1:
            return [CGRect(x: 0, y: 0, width: width, height: height)]

        case 2:
            let w = (width - s) / 2
            return [
                CGRect(x: 0, y: 0, width: w, height: height),
                CGRect(x: w + s, y: 0, width: width - w - s, height: height),
            ]

        case 3:
            let leftW = (width - s) * 2 / 3
            let rightW = width - leftW - s
            let rightH = (height - s) / 2
            return [
                CGRect(x: 0, y: 0, width: leftW, height: height),
                CGRect(x: leftW + s, y: 0, width: rightW, height: rightH),
                CGRect(x: leftW + s, y: rightH + s, width: rightW, height: height - rightH - s),
            ]

        default: // 4+
            let w = (width - s) / 2
            let h = (height - s) / 2
            return [
                CGRect(x: 0, y: 0, width: w, height: h),
                CGRect(x: w + s, y: 0, width: width - w - s, height: h),
                CGRect(x: 0, y: h + s, width: w, height: height - h - s),
                CGRect(x: w + s, y: h + s, width: width - w - s, height: height - h - s),
            ]
        }
    }

    // MARK: - Static Height

    static func gridHeight(for media: [MediaItem], width: CGFloat) -> CGFloat {
        let count = media.count
        guard count > 0 else { return 0 }

        switch count {
        case 1:
            // Single item: use aspect ratio, capped
            let item = media[0]
            if let w = item.width, let h = item.height, w > 0 {
                let ratio = h / w
                return min(max(width * ratio, ChatLayout.imageMinHeight), ChatLayout.imageMaxHeight)
            }
            return ChatLayout.imageMinHeight

        default:
            // Grid: square-ish, capped
            return min(width * 0.75, ChatLayout.imageMaxHeight)
        }
    }

    @objc private func cellTapped(_ gesture: UITapGestureRecognizer) {
        guard let cell = gesture.view else { return }
        onItemTap?(cell.tag)
    }
}

// MARK: - Media Cell View (single item in grid)

private final class MediaCellView: UIView {

    private let imageView = UIImageView()
    private let playIcon = UIImageView()
    private let durationBg = UIView()
    private let durationLabel = UILabel()
    private let overlayView = UIView()
    private let overlayLabel = UILabel()

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        clipsToBounds = true

        imageView.contentMode = .scaleAspectFill
        imageView.backgroundColor = UIColor(white: 0.9, alpha: 1)
        imageView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(imageView)

        // Play icon for video
        let config = UIImage.SymbolConfiguration(pointSize: 28, weight: .regular)
        playIcon.image = UIImage(systemName: "play.circle.fill", withConfiguration: config)
        playIcon.tintColor = .white
        playIcon.layer.shadowColor = UIColor.black.cgColor
        playIcon.layer.shadowOpacity = 0.5
        playIcon.layer.shadowRadius = 4
        playIcon.translatesAutoresizingMaskIntoConstraints = false
        playIcon.isHidden = true
        addSubview(playIcon)

        // Duration badge for video
        durationBg.backgroundColor = UIColor.black.withAlphaComponent(0.5)
        durationBg.layer.cornerRadius = 6
        durationBg.translatesAutoresizingMaskIntoConstraints = false
        durationBg.isHidden = true
        addSubview(durationBg)

        durationLabel.font = ChatLayout.videoDurationFont
        durationLabel.textColor = .white
        durationLabel.translatesAutoresizingMaskIntoConstraints = false
        durationBg.addSubview(durationLabel)

        // "+N" overlay
        overlayView.backgroundColor = UIColor.black.withAlphaComponent(0.55)
        overlayView.isHidden = true
        overlayView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(overlayView)

        overlayLabel.font = .systemFont(ofSize: 28, weight: .semibold)
        overlayLabel.textColor = .white
        overlayLabel.textAlignment = .center
        overlayLabel.translatesAutoresizingMaskIntoConstraints = false
        overlayView.addSubview(overlayLabel)

        NSLayoutConstraint.activate([
            imageView.topAnchor.constraint(equalTo: topAnchor),
            imageView.leadingAnchor.constraint(equalTo: leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: trailingAnchor),
            imageView.bottomAnchor.constraint(equalTo: bottomAnchor),

            playIcon.centerXAnchor.constraint(equalTo: centerXAnchor),
            playIcon.centerYAnchor.constraint(equalTo: centerYAnchor),
            playIcon.widthAnchor.constraint(equalToConstant: 36),
            playIcon.heightAnchor.constraint(equalToConstant: 36),

            durationBg.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -4),
            durationBg.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -4),
            durationLabel.topAnchor.constraint(equalTo: durationBg.topAnchor, constant: 2),
            durationLabel.bottomAnchor.constraint(equalTo: durationBg.bottomAnchor, constant: -2),
            durationLabel.leadingAnchor.constraint(equalTo: durationBg.leadingAnchor, constant: 4),
            durationLabel.trailingAnchor.constraint(equalTo: durationBg.trailingAnchor, constant: -4),

            overlayView.topAnchor.constraint(equalTo: topAnchor),
            overlayView.leadingAnchor.constraint(equalTo: leadingAnchor),
            overlayView.trailingAnchor.constraint(equalTo: trailingAnchor),
            overlayView.bottomAnchor.constraint(equalTo: bottomAnchor),
            overlayLabel.centerXAnchor.constraint(equalTo: overlayView.centerXAnchor),
            overlayLabel.centerYAnchor.constraint(equalTo: overlayView.centerYAnchor),
        ])
    }

    func configure(item: MediaItem) {
        imageView.loadChatImage(url: item.thumbnailUrl)

        if item.isVideo {
            playIcon.isHidden = false
            if let dur = item.duration {
                let mins = Int(dur) / 60
                let secs = Int(dur) % 60
                durationLabel.text = String(format: "%d:%02d", mins, secs)
                durationBg.isHidden = false
            }
        } else {
            playIcon.isHidden = true
            durationBg.isHidden = true
        }
    }

    func showOverlay(remaining: Int) {
        overlayView.isHidden = false
        overlayLabel.text = "+\(remaining)"
    }
}

import UIKit

final class VoiceContentView: UIView {
    var onPlayTap: (() -> Void)?

    private let playButton = UIButton(type: .system)
    private let waveformView = WaveformView()
    private let durationLabel = UILabel()
    private var voiceURL: String?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        let config = UIImage.SymbolConfiguration(pointSize: 18, weight: .medium)
        playButton.setImage(UIImage(systemName: "play.fill", withConfiguration: config), for: .normal)
        playButton.translatesAutoresizingMaskIntoConstraints = false
        playButton.addTarget(self, action: #selector(playTapped), for: .touchUpInside)
        addSubview(playButton)

        waveformView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(waveformView)

        durationLabel.font = ChatLayout.current.voiceDurationFont
        durationLabel.translatesAutoresizingMaskIntoConstraints = false
        addSubview(durationLabel)

        NSLayoutConstraint.activate([
            playButton.leadingAnchor.constraint(equalTo: leadingAnchor),
            playButton.centerYAnchor.constraint(equalTo: centerYAnchor),
            playButton.widthAnchor.constraint(equalToConstant: ChatLayout.current.voicePlaySize),
            playButton.heightAnchor.constraint(equalToConstant: ChatLayout.current.voicePlaySize),
            waveformView.leadingAnchor.constraint(equalTo: playButton.trailingAnchor, constant: 8),
            waveformView.trailingAnchor.constraint(equalTo: trailingAnchor),
            waveformView.topAnchor.constraint(equalTo: topAnchor),
            waveformView.heightAnchor.constraint(equalToConstant: ChatLayout.current.voiceWaveformHeight),
            durationLabel.leadingAnchor.constraint(equalTo: playButton.trailingAnchor, constant: 8),
            durationLabel.topAnchor.constraint(equalTo: waveformView.bottomAnchor, constant: 4),
            durationLabel.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
    }

    func configure(voice: VoicePayload, isMine: Bool, theme: ChatTheme) {
        voiceURL = voice.url

        let mins = Int(voice.duration) / 60
        let secs = Int(voice.duration) % 60
        durationLabel.text = String(format: "%d:%02d", mins, secs)
        durationLabel.textColor = isMine ? theme.outgoingTime : theme.incomingTime

        playButton.tintColor = isMine ? theme.outgoingText : theme.inputBarTint

        waveformView.configure(
            waveform: voice.waveform,
            activeColor: theme.voiceWaveformActive,
            inactiveColor: theme.voiceWaveformInactive,
            progress: 0
        )

        updatePlaybackState(theme: theme, isMine: isMine)
        VoicePlayer.shared.delegate = self
    }

    func updatePlaybackState(theme: ChatTheme, isMine: Bool) {
        let state = VoicePlayer.shared.state
        let isMe = state.url == voiceURL
        let config = UIImage.SymbolConfiguration(pointSize: 18, weight: .medium)

        if isMe && state.isPlaying {
            playButton.setImage(UIImage(systemName: "pause.fill", withConfiguration: config), for: .normal)
        } else {
            playButton.setImage(UIImage(systemName: "play.fill", withConfiguration: config), for: .normal)
        }

        if isMe, case .playing(_, let progress, let currentTime) = state {
            waveformView.updateProgress(progress)
            let mins = Int(currentTime) / 60
            let secs = Int(currentTime) % 60
            durationLabel.text = String(format: "%d:%02d", mins, secs)
        } else if isMe, case .paused(_, let progress, let currentTime) = state {
            waveformView.updateProgress(progress)
            let mins = Int(currentTime) / 60
            let secs = Int(currentTime) % 60
            durationLabel.text = String(format: "%d:%02d", mins, secs)
        } else {
            waveformView.updateProgress(0)
        }
    }

    @objc private func playTapped() { onPlayTap?() }
}

// MARK: - VoicePlayerDelegate

extension VoiceContentView: VoicePlayerDelegate {
    func voicePlayerDidChangeState(_ state: VoicePlayerState) {
        updatePlaybackState(theme: .light, isMine: false)
    }
}

// MARK: - WaveformView

final class WaveformView: UIView {
    private var bars: [CALayer] = []
    private var waveform: [Float] = []
    private var activeColor: UIColor = .systemBlue
    private var inactiveColor: UIColor = .lightGray
    private var progress: Float = 0

    func configure(waveform: [Float], activeColor: UIColor, inactiveColor: UIColor, progress: Float) {
        self.waveform = waveform.isEmpty ? Array(repeating: 0.3, count: 40) : waveform
        self.activeColor = activeColor
        self.inactiveColor = inactiveColor
        self.progress = progress
        setNeedsLayout()
    }

    func updateProgress(_ progress: Float) {
        self.progress = progress
        updateBarColors()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        bars.forEach { $0.removeFromSuperlayer() }
        bars.removeAll()

        guard bounds.width > 0 else { return }

        let barW = ChatLayout.current.voiceBarWidth
        let spacing = ChatLayout.current.voiceBarSpacing
        let totalW = barW + spacing
        let count = Int(bounds.width / totalW)
        guard count > 0 else { return }

        let normalized = resample(waveform, to: count)

        for i in 0..<count {
            let bar = CALayer()
            let h = max(2, CGFloat(normalized[i]) * bounds.height)
            bar.frame = CGRect(
                x: CGFloat(i) * totalW,
                y: (bounds.height - h) / 2,
                width: barW,
                height: h
            )
            bar.cornerRadius = barW / 2
            layer.addSublayer(bar)
            bars.append(bar)
        }
        updateBarColors()
    }

    private func updateBarColors() {
        let activeCount = Int(Float(bars.count) * progress)
        for (i, bar) in bars.enumerated() {
            bar.backgroundColor = (i < activeCount ? activeColor : inactiveColor).cgColor
        }
    }

    private func resample(_ data: [Float], to count: Int) -> [Float] {
        guard !data.isEmpty else { return Array(repeating: 0.3, count: count) }
        return (0..<count).map { i in
            let idx = Float(i) / Float(count) * Float(data.count)
            let lower = Int(idx)
            let upper = min(lower + 1, data.count - 1)
            let frac = idx - Float(lower)
            return data[lower] * (1 - frac) + data[upper] * frac
        }
    }
}

import AVFoundation
import UIKit

// MARK: - State

enum VoicePlayerState: Equatable {
    case idle
    case loading(url: String)
    case playing(url: String, progress: Float, currentTime: TimeInterval)
    case paused(url: String, progress: Float, currentTime: TimeInterval)

    var url: String? {
        switch self {
        case .idle: return nil
        case .loading(let u): return u
        case .playing(let u, _, _): return u
        case .paused(let u, _, _): return u
        }
    }

    var isPlaying: Bool {
        if case .playing = self { return true }
        return false
    }
}

// MARK: - Delegate

protocol VoicePlayerDelegate: AnyObject {
    func voicePlayerDidChangeState(_ state: VoicePlayerState)
}

// MARK: - VoicePlayer

final class VoicePlayer {
    static let shared = VoicePlayer()

    weak var delegate: VoicePlayerDelegate?
    private(set) var state: VoicePlayerState = .idle {
        didSet { delegate?.voicePlayerDidChangeState(state) }
    }

    private var player: AVPlayer?
    private var timeObserver: Any?
    private var endObserver: NSObjectProtocol?
    private var preloadedAssets: [String: AVPlayerItem] = [:]

    private init() {}

    // MARK: - Public API

    func toggle(url: String) {
        switch state {
        case .playing(let u, _, _) where u == url:
            pause()
        case .paused(let u, let p, let t) where u == url:
            resume(url: u, progress: p, currentTime: t)
        default:
            play(url: url)
        }
    }

    func stop() {
        cleanup()
        state = .idle
    }

    func preload(url: String) {
        guard preloadedAssets[url] == nil, let assetURL = URL(string: url) else { return }
        let asset = AVURLAsset(url: assetURL)
        let item = AVPlayerItem(asset: asset)
        preloadedAssets[url] = item
    }

    // MARK: - Private

    private func play(url: String) {
        cleanup()
        state = .loading(url: url)

        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default)
            try session.setActive(true)
        } catch {
            state = .idle
            return
        }

        let item: AVPlayerItem
        if let preloaded = preloadedAssets.removeValue(forKey: url) {
            item = preloaded
        } else if let assetURL = URL(string: url) {
            item = AVPlayerItem(asset: AVURLAsset(url: assetURL))
        } else {
            state = .idle
            return
        }

        player = AVPlayer(playerItem: item)
        setupObservers(url: url)
        player?.play()
        state = .playing(url: url, progress: 0, currentTime: 0)
    }

    private func pause() {
        guard case .playing(let url, let progress, let currentTime) = state else { return }
        player?.pause()
        state = .paused(url: url, progress: progress, currentTime: currentTime)
    }

    private func resume(url: String, progress: Float, currentTime: TimeInterval) {
        player?.play()
        state = .playing(url: url, progress: progress, currentTime: currentTime)
    }

    private func setupObservers(url: String) {
        let interval = CMTime(seconds: 0.05, preferredTimescale: 600)
        timeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            guard let self, case .playing(let u, _, _) = self.state, u == url else { return }
            let current = CMTimeGetSeconds(time)
            let duration = CMTimeGetSeconds(self.player?.currentItem?.duration ?? .zero)
            guard duration > 0, duration.isFinite else { return }
            let progress = Float(current / duration)
            self.state = .playing(url: u, progress: progress, currentTime: current)
        }

        endObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: player?.currentItem, queue: .main
        ) { [weak self] _ in
            self?.stop()
        }
    }

    private func cleanup() {
        if let obs = timeObserver { player?.removeTimeObserver(obs) }
        if let obs = endObserver { NotificationCenter.default.removeObserver(obs) }
        timeObserver = nil
        endObserver = nil
        player?.pause()
        player = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    deinit { cleanup() }
}

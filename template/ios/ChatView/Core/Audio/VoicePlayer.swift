// MARK: - VoicePlayer.swift
// Singleton плеер голосовых сообщений с предзагрузкой, паузой и прогрессом.

import AVFoundation

// MARK: - VoicePlayerState

enum VoicePlayerState: Equatable {
    case idle
    case loading(messageId: String)
    case playing(messageId: String)
    case paused(messageId: String)
}

// MARK: - VoicePlayerDelegate

protocol VoicePlayerDelegate: AnyObject {
    func voicePlayer(_ player: VoicePlayer, didChangeState state: VoicePlayerState, previousMessageId: String?)
    func voicePlayer(_ player: VoicePlayer, didUpdateProgress progress: Float, messageId: String)
}

extension VoicePlayerDelegate {
    func voicePlayer(_ player: VoicePlayer, didUpdateProgress progress: Float, messageId: String) {}
}

// MARK: - VoicePlayer

final class VoicePlayer: NSObject {

    static let shared = VoicePlayer()

    weak var delegate: VoicePlayerDelegate?

    private var player: AVPlayer?
    private var timeObserver: Any?
    private var statusObserver: NSKeyValueObservation?
    private var currentURL: URL?
    private(set) var state: VoicePlayerState = .idle
    private(set) var progress: Float = 0

    /// Кеш предзагруженных AVAsset по URL.
    private var preloadedAssets: [String: AVURLAsset] = [:]
    private var loadingURLs: Set<String> = []

    var currentMessageId: String? {
        switch state {
        case .idle: return nil
        case .loading(let id), .playing(let id), .paused(let id): return id
        }
    }

    var isPlaying: Bool {
        if case .playing = state { return true }
        return false
    }

    private override init() {
        super.init()
    }

    // MARK: - Preload

    func preload(url: URL) {
        let key = url.absoluteString
        guard preloadedAssets[key] == nil, !loadingURLs.contains(key) else { return }
        loadingURLs.insert(key)

        let asset = AVURLAsset(url: url)
        asset.loadValuesAsynchronously(forKeys: ["playable", "duration"]) { [weak self] in
            DispatchQueue.main.async {
                guard let self else { return }
                self.loadingURLs.remove(key)
                var error: NSError?
                if asset.statusOfValue(forKey: "playable", error: &error) == .loaded {
                    self.preloadedAssets[key] = asset
                }
            }
        }
    }

    // MARK: - Toggle (play / pause / resume)

    func toggle(url: URL, messageId: String) {
        switch state {
        case .playing(let id) where id == messageId:
            pause()
        case .paused(let id) where id == messageId:
            resume()
        case .loading(let id) where id == messageId:
            stopAndReset()
        default:
            // Другой или idle — начать новый
            play(url: url, messageId: messageId)
        }
    }

    func stop() {
        stopAndReset()
    }

    // MARK: - Play

    private func play(url: URL, messageId: String) {
        let previousId = currentMessageId

        cleanupPlayer()

        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            NSLog("[VoicePlayer] Audio session error: \(error)")
            return
        }

        currentURL = url
        progress = 0

        let key = url.absoluteString
        let item: AVPlayerItem

        if let asset = preloadedAssets.removeValue(forKey: key) {
            item = AVPlayerItem(asset: asset)
        } else {
            item = AVPlayerItem(url: url)
        }

        let avPlayer = AVPlayer(playerItem: item)
        player = avPlayer

        setState(.loading(messageId: messageId), previousId: previousId)

        statusObserver = item.observe(\.status, options: [.new]) { [weak self] item, _ in
            DispatchQueue.main.async {
                guard let self else { return }
                switch item.status {
                case .readyToPlay:
                    self.statusObserver = nil
                    guard case .loading(let id) = self.state, id == messageId else { return }
                    self.beginPlayback(messageId: messageId)
                case .failed:
                    self.statusObserver = nil
                    self.stopAndReset()
                default:
                    break
                }
            }
        }

        if item.status == .readyToPlay {
            statusObserver = nil
            beginPlayback(messageId: messageId)
        }

        NotificationCenter.default.addObserver(
            self, selector: #selector(playerDidFinish),
            name: .AVPlayerItemDidPlayToEndTime, object: item
        )
    }

    private func beginPlayback(messageId: String) {
        guard let player else { return }

        let interval = CMTime(seconds: 0.05, preferredTimescale: 600)
        timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            guard let self, let item = self.player?.currentItem else { return }
            let duration = CMTimeGetSeconds(item.duration)
            guard duration.isFinite, duration > 0 else { return }
            self.progress = Float(CMTimeGetSeconds(time) / duration)
            if let id = self.currentMessageId {
                self.delegate?.voicePlayer(self, didUpdateProgress: self.progress, messageId: id)
            }
        }

        player.play()
        setState(.playing(messageId: messageId), previousId: nil)
    }

    // MARK: - Pause / Resume

    private func pause() {
        guard let id = currentMessageId else { return }
        player?.pause()
        removeTimeObserver()
        setState(.paused(messageId: id), previousId: nil)
    }

    private func resume() {
        guard let player, let id = currentMessageId else { return }

        let interval = CMTime(seconds: 0.05, preferredTimescale: 600)
        timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            guard let self, let item = self.player?.currentItem else { return }
            let duration = CMTimeGetSeconds(item.duration)
            guard duration.isFinite, duration > 0 else { return }
            self.progress = Float(CMTimeGetSeconds(time) / duration)
            self.delegate?.voicePlayer(self, didUpdateProgress: self.progress, messageId: id)
        }

        player.play()
        setState(.playing(messageId: id), previousId: nil)
    }

    // MARK: - Stop

    private func stopAndReset() {
        let previousId = currentMessageId
        progress = 0
        cleanupPlayer()
        setState(.idle, previousId: previousId)
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    private func cleanupPlayer() {
        statusObserver?.invalidate()
        statusObserver = nil
        removeTimeObserver()
        player?.pause()
        player = nil
        currentURL = nil
        NotificationCenter.default.removeObserver(self, name: .AVPlayerItemDidPlayToEndTime, object: nil)
    }

    private func removeTimeObserver() {
        if let observer = timeObserver, let p = player {
            p.removeTimeObserver(observer)
        }
        timeObserver = nil
    }

    private func setState(_ newState: VoicePlayerState, previousId: String?) {
        let old = state
        state = newState
        if old != newState {
            delegate?.voicePlayer(self, didChangeState: newState, previousMessageId: previousId)
        }
    }

    @objc private func playerDidFinish() {
        stopAndReset()
    }
}

// MARK: - VoiceRecorder.swift
// Хелпер для записи голосовых сообщений через AVAudioRecorder.

import AVFoundation

// MARK: - VoiceRecorderDelegate

protocol VoiceRecorderDelegate: AnyObject {
    func voiceRecorderDidStart(_ recorder: VoiceRecorder)
    func voiceRecorderDidStop(_ recorder: VoiceRecorder, fileURL: URL, duration: TimeInterval)
    func voiceRecorderDidCancel(_ recorder: VoiceRecorder)
    func voiceRecorderDidUpdateTime(_ recorder: VoiceRecorder, currentTime: TimeInterval)
}

// MARK: - VoiceRecorder

final class VoiceRecorder: NSObject {

    weak var delegate: VoiceRecorderDelegate?

    private var audioRecorder: AVAudioRecorder?
    private var displayLink: CADisplayLink?
    private var startTime: Date?
    private var tempFileURL: URL?

    var isRecording: Bool { audioRecorder?.isRecording ?? false }

    var currentDuration: TimeInterval {
        guard let startTime else { return 0 }
        return Date().timeIntervalSince(startTime)
    }

    // MARK: - Public API

    func startRecording() {
        let session = AVAudioSession.sharedInstance()

        if #available(iOS 17.0, *) {
            switch AVAudioApplication.shared.recordPermission {
            case .granted:
                beginRecording(session: session)
            case .denied:
                break
            case .undetermined:
                AVAudioApplication.requestRecordPermission { [weak self] granted in
                    DispatchQueue.main.async {
                        if granted { self?.beginRecording(session: session) }
                    }
                }
            @unknown default:
                break
            }
        } else {
            switch session.recordPermission {
            case .granted:
                beginRecording(session: session)
            case .denied:
                break
            case .undetermined:
                session.requestRecordPermission { [weak self] granted in
                    DispatchQueue.main.async {
                        if granted { self?.beginRecording(session: session) }
                    }
                }
            @unknown default:
                break
            }
        }
    }

    func stopRecording() {
        guard let recorder = audioRecorder, recorder.isRecording else { return }
        let duration = currentDuration
        recorder.stop()
        stopTimer()
        deactivateAudioSession()

        if let url = tempFileURL {
            delegate?.voiceRecorderDidStop(self, fileURL: url, duration: duration)
        }

        audioRecorder = nil
        startTime = nil
    }

    func cancelRecording() {
        audioRecorder?.stop()
        stopTimer()

        if let url = tempFileURL {
            try? FileManager.default.removeItem(at: url)
        }

        deactivateAudioSession()

        audioRecorder = nil
        tempFileURL = nil
        startTime = nil

        delegate?.voiceRecorderDidCancel(self)
    }

    // MARK: - Private

    private func beginRecording(session: AVAudioSession) {
        if audioRecorder?.isRecording == true { return }

        do {
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
            try session.setActive(true)
        } catch {
            NSLog("[VoiceRecorder] Failed to configure audio session: \(error)")
            return
        }

        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("voice_\(UUID().uuidString)")
            .appendingPathExtension("m4a")
        tempFileURL = url

        let settings: [String: Any] = [
            AVFormatIDKey:            Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey:          44100.0,
            AVNumberOfChannelsKey:    1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
            AVEncoderBitRateKey:      128_000,
        ]

        do {
            let recorder = try AVAudioRecorder(url: url, settings: settings)
            recorder.delegate = self
            recorder.prepareToRecord()
            audioRecorder = recorder

            if recorder.record() {
                startTime = Date()
                startTimer()
                delegate?.voiceRecorderDidStart(self)
            }
        } catch {
            NSLog("[VoiceRecorder] Failed to create recorder: \(error)")
        }
    }

    private func startTimer() {
        stopTimer()
        let link = CADisplayLink(target: self, selector: #selector(timerTick))
        link.preferredFrameRateRange = CAFrameRateRange(minimum: 10, maximum: 15, preferred: 10)
        link.add(to: .main, forMode: .common)
        displayLink = link
    }

    private func stopTimer() {
        displayLink?.invalidate()
        displayLink = nil
    }

    @objc private func timerTick() {
        guard isRecording else { return }
        delegate?.voiceRecorderDidUpdateTime(self, currentTime: currentDuration)
    }

    private func deactivateAudioSession() {
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}

// MARK: - AVAudioRecorderDelegate

extension VoiceRecorder: AVAudioRecorderDelegate {
    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {}
}

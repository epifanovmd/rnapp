import UIKit

// MARK: - InputBarDelegate

extension ChatViewController: InputBarDelegate {

    func inputBar(_ bar: InputBarView, didSendText text: String, replyToId: String?) {
        delegate?.chatViewController(self, didSendMessage: text, replyToId: replyToId)
    }

    func inputBar(_ bar: InputBarView, didEditText text: String, messageId: String) {
        delegate?.chatViewController(self, didEditMessage: text, messageId: messageId)
    }

    func inputBarDidCancelReply(_ bar: InputBarView) {
        delegate?.chatViewController(self, didCancelReply: self)
    }

    func inputBarDidCancelEdit(_ bar: InputBarView) {
        delegate?.chatViewController(self, didCancelEdit: self)
    }

    /// Анимирует изменение высоты inputBar и синхронизирует contentInset коллекции.
    func inputBar(_ bar: InputBarView, didChangeHeight height: CGFloat) {
        UIViewPropertyAnimator(duration: 0.25, dampingRatio: 0.85) { [weak self] in
            self?.view.layoutIfNeeded()
        }.startAnimation()
    }

    func inputBarDidTapAttachment(_ bar: InputBarView) {
        delegate?.chatViewControllerDidTapAttachment(self)
    }

    func inputBarDidStartVoiceRecording(_ bar: InputBarView) {
        voiceRecorder.startRecording()
    }

    func inputBarDidStopVoiceRecording(_ bar: InputBarView) {
        voiceRecorder.stopRecording()
    }

    func inputBarDidCancelVoiceRecording(_ bar: InputBarView) {
        voiceRecorder.cancelRecording()
    }
}

// MARK: - VoiceRecorderDelegate

extension ChatViewController: VoiceRecorderDelegate {

    func voiceRecorderDidStart(_ recorder: VoiceRecorder) {}

    func voiceRecorderDidStop(_ recorder: VoiceRecorder, fileURL: URL, duration: TimeInterval) {
        inputBar.resetRecordingUI()
        delegate?.chatViewController(self, didFinishVoiceRecording: fileURL, duration: duration)
    }

    func voiceRecorderDidCancel(_ recorder: VoiceRecorder) {
        inputBar.resetRecordingUI()
    }

    func voiceRecorderDidUpdateTime(_ recorder: VoiceRecorder, currentTime: TimeInterval) {
        inputBar.updateRecordingTime(currentTime)
    }
}

// MARK: - VoicePlayerDelegate

extension ChatViewController: VoicePlayerDelegate {

    func voicePlayer(_ player: VoicePlayer, didChangeState state: VoicePlayerState, previousMessageId: String?) {
        if let prevId = previousMessageId {
            syncVoiceCell(messageId: prevId)
        }

        switch state {
        case .loading(let id), .playing(let id), .paused(let id):
            syncVoiceCell(messageId: id)
        case .idle:
            break
        }
    }

    func voicePlayer(_ player: VoicePlayer, didUpdateProgress progress: Float, messageId: String) {
        guard let ip = indexPathIndex[messageId],
              let cell = collectionView.cellForItem(at: ip) as? MessageCell,
              let voiceView = cell.bubbleView.contentView as? VoiceContentView
        else { return }
        voiceView.updateProgress(progress)
    }

    private func syncVoiceCell(messageId: String) {
        guard let ip = indexPathIndex[messageId],
              let cell = collectionView.cellForItem(at: ip) as? MessageCell,
              let voiceView = cell.bubbleView.contentView as? VoiceContentView
        else { return }
        voiceView.syncWithPlayer()
    }
}

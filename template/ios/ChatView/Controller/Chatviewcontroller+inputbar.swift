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
}

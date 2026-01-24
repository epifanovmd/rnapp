////
////  ChatViewManager+Methods.swift
////  rnapp
////
////  Created by Andrei on 18.01.2026.
////

extension ChatViewManager {
  @objc func appendMessages(_ node: NSNumber, messages: [[String: Any]]) {
    DispatchQueue.main.async {
      guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else {
        return
      }

      let rawMessages = messages.compactMap { dict -> RawMessage? in
        guard let idString = dict["id"] as? String,
              let id = UUID(uuidString: idString),
              let userId = dict["userId"] as? Int else { return nil }

        // Извлекаем текст из вложенного объекта data или напрямую
        let dataDict = dict["data"] as? [String: Any]
        let text = (dataDict?["text"] as? String) ?? (dict["text"] as? String) ?? ""

        // Обработка даты (из timestamp в Date)
        let date: Date
        if let timestamp = dict["date"] as? Double {
          date = Date(timeIntervalSince1970: timestamp / 1000.0)
        } else {
          date = Date()
        }

        return RawMessage(id: id, date: date, data: .text(text), userId: userId)
      }

      view.chatController.appendMessages(rawMessages)
    }

  }

  @objc func deleteMessage(_ node: NSNumber, messageId: String) {
    DispatchQueue.main.async {
      guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else {
        return
      }
      guard let id = UUID(uuidString: messageId) else { return }
      view.chatController.deleteMessage(with: id)
    }
  }

  @objc func setTyping(_ node: NSNumber, isTyping: Bool) {
    DispatchQueue.main.async {
      guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else {
        return
      }
      view.chatController.typingStateChanged(to: isTyping ? .typing : .idle)
    }
  }

  @objc func scrollToBottom(_ node: NSNumber, animated: Bool) {
    DispatchQueue.main.async {
      guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else { return }
      view.chatViewController.scrollToBottom(animated: animated)
    }
  }

  @objc func scrollToMessage(_ node: NSNumber, messageId: String, animated: Bool) {
    DispatchQueue.main.async {
      guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer,
            let id = UUID(uuidString: messageId) else { return }
      view.chatViewController.scrollTo(messageId: id, animated: animated)
    }
  }

  @objc func scrollToIndex(_ node: NSNumber, index: NSNumber, animated: Bool) {
    DispatchQueue.main.async {
      guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else { return }
      view.chatViewController.scrollTo(index: index.intValue, animated: animated)
    }
  }

  @objc func scrollToOffset(_ node: NSNumber, offset: NSNumber, animated: Bool) {
    DispatchQueue.main.async {
      guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else { return }
      view.chatViewController.scrollTo(offset: CGFloat(offset.doubleValue), animated: animated)
    }
  }

  @objc func scrollToDate(_ node: NSNumber, timestamp: NSNumber, animated: Bool) {
    DispatchQueue.main.async {
      guard let view = self.bridge.uiManager.view(forReactTag: node) as? RNChatContainer else { return }
      let date = Date(timeIntervalSince1970: timestamp.doubleValue / 1000.0)
      view.chatViewController.scrollTo(date: date, animated: animated)
    }
  }
}

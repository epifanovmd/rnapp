//
// ChatLayout
// DefaultChatController.swift
// https://github.com/ekazaev/ChatLayout
//
// Created by Eugene Kazaev in 2020-2026.
// Distributed under the MIT license.
//
// Become a sponsor:
// https://github.com/sponsors/ekazaev
//

import Foundation

final class DefaultChatController: ChatController {
  weak var delegate: ChatViewControllerDelegate?
  
  private var typingState: TypingState = .idle
  
  private let dispatchQueue = DispatchQueue(label: "DefaultChatController", qos: .userInteractive)
  
  var userId: Int? = nil
  
  var messages: [RawMessage] = []
  
  func appendMessages(_ rawMessages: [RawMessage]) {
    appendMessages(rawMessages, true)
  }
  
  func appendMessages(_ rawMessages: [RawMessage], _ animated: Bool = true) {
    var currentMessages = messages
    currentMessages.append(contentsOf: rawMessages)
    // Убираем дубликаты по ID и сортируем по дате
    let uniqueMessages = Array(Dictionary(grouping: currentMessages, by: { $0.id }).values.compactMap { $0.last })
    self.messages = uniqueMessages.sorted(by: { $0.date.timeIntervalSince1970 < $1.date.timeIntervalSince1970 })
    repopulateMessages(requiresIsolatedProcess: false, animated: animated)
  }
  
  func deleteMessage(with id: UUID) {
    messages.removeAll(where: { $0.id == id })
    repopulateMessages(requiresIsolatedProcess: true)
  }
  
  func typingStateChanged(to state: TypingState) {
    self.typingState = state
    repopulateMessages()
  }
  
  func markMessagesAsRead(ids: [UUID]) {
    updateMessagesStatus(ids: ids, newStatus: .read)
  }
  
  func markMessagesAsReceived(ids: [UUID]) {
    updateMessagesStatus(ids: ids, newStatus: .received)
  }
  
  func reloadMessage(with id: UUID) {
    repopulateMessages()
  }
  
  private func propagateLatestMessages(completion: @escaping ([Section]) -> Void) {
    var lastMessageStorage: Message?
    dispatchQueue.async { [weak self] in
      guard let self else { return }
      
      let messagesSplitByDay = messages
        .map { Message(
          id: $0.id,
          date: $0.date,
          data: self.convert($0.data),
          owner: User(id: $0.userId),
          type: $0.userId == self.userId ? .outgoing : .incoming,
          status: $0.status
        ) }
        .reduce(into: [[Message]]()) { result, message in
          guard var section = result.last,
                let prevMessage = section.last else {
            let section = [message]
            result.append(section)
            return
          }
          if Calendar.current.isDate(prevMessage.date, equalTo: message.date, toGranularity: .day) {
            section.append(message)
            result[result.count - 1] = section
          } else {
            let section = [message]
            result.append(section)
          }
        }
      
      let cells = messagesSplitByDay.enumerated().map { index, messages -> [Cell] in
        var cells: [Cell] = Array(messages.enumerated().map { index, message -> [Cell] in
          let bubble: Cell.BubbleType
          if index < messages.count - 1 {
            let nextMessage = messages[index + 1]
            bubble = nextMessage.owner == message.owner ? .normal : .tailed
          } else {
            bubble = .tailed
          }
          guard message.type != .outgoing else {
            lastMessageStorage = message
            return [.message(message, bubbleType: bubble)]
          }
          
          let titleCell = Cell.messageGroup(MessageGroup(id: message.id, title: "\(message.owner.name)", type: message.type))
          
          if let lastMessage = lastMessageStorage {
            if lastMessage.owner != message.owner {
              lastMessageStorage = message
              return [titleCell, .message(message, bubbleType: bubble)]
            } else {
              lastMessageStorage = message
              return [.message(message, bubbleType: bubble)]
            }
          } else {
            lastMessageStorage = message
            return [titleCell, .message(message, bubbleType: bubble)]
          }
        }.joined())
        
        if let firstMessage = messages.first {
          let dateCell = Cell.date(DateGroup(id: firstMessage.id, date: firstMessage.date))
          cells.insert(dateCell, at: 0)
        }
        
        if self.typingState == .typing,
           index == messagesSplitByDay.count - 1 {
          cells.append(.typingIndicator)
        }
        
        return cells // Section(id: sectionTitle.hashValue, title: sectionTitle, cells: cells)
      }.joined()
      
      DispatchQueue.main.async { [weak self] in
        guard self != nil else {
          return
        }
        completion([Section(id: 0, title: "Loading...", cells: Array(cells))])
      }
    }
  }
  
  private func convert(_ data: Message.Data) -> RawMessage.Data {
    switch data {
    case let .url(url, isLocallyStored: _):
        .url(url)
    case let .image(source, isLocallyStored: _):
        .image(source)
    case let .text(text):
        .text(text)
    }
  }
  
  private func convert(_ data: RawMessage.Data) -> Message.Data {
    switch data {
    case let .url(url):
      let isLocallyStored: Bool
      if #available(iOS 13, *) {
        isLocallyStored = metadataCache.isEntityCached(for: url)
      } else {
        isLocallyStored = true
      }
      return .url(url, isLocallyStored: isLocallyStored)
    case let .image(source):
      func isPresentLocally(_ source: ImageMessageSource) -> Bool {
        switch source {
        case .image:
          true
        case let .imageURL(url):
          imageCache.isEntityCached(for: CacheableImageKey(url: url))
        }
      }
      return .image(source, isLocallyStored: isPresentLocally(source))
    case let .text(text):
      return .text(text)
    }
  }
  
  private func repopulateMessages(requiresIsolatedProcess: Bool = false, animated: Bool = true) {
    propagateLatestMessages { sections in
      self.delegate?.update(with: sections, requiresIsolatedProcess: requiresIsolatedProcess, animated: animated)
    }
  }
  
  private func updateMessagesStatus(ids: [UUID], newStatus: MessageStatus) {
    guard !ids.isEmpty else { return }
    let idSet = Set(ids)
    
    dispatchQueue.async { [weak self] in
      guard let self else { return }
      var hasChanges = false
      
      self.messages = self.messages.map { message in
        // Обновляем статус только если ID в списке и новый статус "старше" текущего
        if idSet.contains(message.id), self.shouldUpdateStatus(from: message.status, to: newStatus) {
          var updatedMessage = message
          updatedMessage.status = newStatus
          hasChanges = true
          return updatedMessage
        }
        return message
      }
      
      if hasChanges {
        DispatchQueue.main.async {
          self.repopulateMessages()
        }
      }
    }
  }
  
  private func shouldUpdateStatus(from old: MessageStatus, to new: MessageStatus) -> Bool {
    switch (old, new) {
    case (.sent, .received), (.sent, .read), (.received, .read):
      return true
    default:
      return false
    }
  }
}


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
  
  private let dispatchQueue = DispatchQueue(label: "DefaultChatController", qos: .userInteractive)
  
  var userId: Int? = nil
  
  var configuration: ChatConfiguration
  
  var messages: [RawMessage] = []
  
  init(configuration: ChatConfiguration) {
    self.configuration = configuration
  }
  
  func setMessages(_ rawMessages: [RawMessage]) {
    setMessages(rawMessages, true)
  }
  
  func setMessages(_ rawMessages: [RawMessage], _ animated: Bool) {
    self.messages = deduplicatePreservingOrder(rawMessages)
    repopulateMessages(requiresIsolatedProcess: false, animated: animated)
  }
  
  func appendMessages(_ rawMessages: [RawMessage]) {
    appendMessages(rawMessages, true)
  }
  
  func appendMessages(_ rawMessages: [RawMessage], _ animated: Bool = true) {
    var currentMessages = messages
    for message in rawMessages {
      if let index = currentMessages.firstIndex(where: { $0.id == message.id }) {
        currentMessages[index] = message
      } else {
        currentMessages.append(message)
      }
    }
    self.messages = currentMessages
    repopulateMessages(requiresIsolatedProcess: false, animated: animated)
  }

  func prependMessages(_ rawMessages: [RawMessage]) {
    prependMessages(rawMessages, true)
  }

  func prependMessages(_ rawMessages: [RawMessage], _ animated: Bool = true) {
    guard !rawMessages.isEmpty else {
      return
    }
    var currentMessages = messages
    var indexById: [UUID: Int] = [:]
    indexById.reserveCapacity(currentMessages.count)
    for (index, message) in currentMessages.enumerated() {
      indexById[message.id] = index
    }

    var prepend: [RawMessage] = []
    prepend.reserveCapacity(rawMessages.count)
    for message in rawMessages {
      if let index = indexById[message.id] {
        currentMessages[index] = message
      } else {
        prepend.append(message)
      }
    }

    self.messages = prepend + currentMessages
    repopulateMessages(requiresIsolatedProcess: true, animated: animated)
  }
  
  func deleteMessage(with id: UUID) {
    messages.removeAll(where: { $0.id == id })
    repopulateMessages(requiresIsolatedProcess: true)
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
    dispatchQueue.async { [weak self] in
      guard let self else { return }

      enum ChatEntry {
        case message(Message)
        case system(SystemMessage)

        var date: Date {
          switch self {
          case let .message(message):
            message.date
          case let .system(message):
            message.date
          }
        }
      }

      let rawById = Dictionary(uniqueKeysWithValues: messages.map { ($0.id, $0) })

      func replyPreview(for rawMessage: RawMessage) -> ReplyPreview? {
        guard configuration.behavior.showsReplyPreview,
              let replyId = rawMessage.replyToId,
              let referenced = rawById[replyId],
              referenced.data.isSystem == false else {
          return nil
        }
        let text = configuration.behavior.replyPreviewTextProvider(referenced.data, referenced.user)
        let resolvedType = referenced.direction ?? (referenced.user.id == self.userId ? .outgoing : .incoming)
        return ReplyPreview(id: replyId, senderName: referenced.user.displayName, text: text, data: referenced.data, type: resolvedType)
      }

      let entriesSplitByDay = messages
        .map { rawMessage -> ChatEntry in
          switch rawMessage.data {
          case let .system(text):
            return .system(SystemMessage(id: rawMessage.id, date: rawMessage.date, text: text))
          default:
            let resolvedType = rawMessage.direction ?? (rawMessage.user.id == self.userId ? .outgoing : .incoming)
            return .message(
              Message(
                id: rawMessage.id,
                date: rawMessage.date,
                data: self.convert(rawMessage.data),
                owner: rawMessage.user,
                type: resolvedType,
                status: rawMessage.status,
                showsHeader: false,
                replyPreview: replyPreview(for: rawMessage)
              )
            )
          }
        }
        .reduce(into: [[ChatEntry]]()) { result, entry in
          guard var section = result.last,
                let prevEntry = section.last else {
            result.append([entry])
            return
          }
          if Calendar.current.isDate(prevEntry.date, equalTo: entry.date, toGranularity: .day) {
            section.append(entry)
            result[result.count - 1] = section
          } else {
            result.append([entry])
          }
        }

      let entriesWithHeaders = entriesSplitByDay.map { sectionEntries -> [ChatEntry] in
        var previousOwner: ChatUser?
        return sectionEntries.map { entry in
          switch entry {
          case var .message(message):
            if message.type == .outgoing {
              message.showsHeader = false
            } else {
              message.showsHeader = previousOwner != message.owner
            }
            previousOwner = message.owner
            return .message(message)
          case .system:
            previousOwner = nil
            return entry
          }
        }
      }

      let cells = entriesWithHeaders.enumerated().map { index, entries -> [Cell] in
        var cells: [Cell] = []
        cells.reserveCapacity(entries.count + 1)

        for i in entries.indices {
          let entry = entries[i]
          switch entry {
          case let .system(message):
            cells.append(.system(message))
          case let .message(message):
            let bubble: Cell.BubbleType
            if i < entries.count - 1 {
              if case let .message(nextMessage) = entries[i + 1], nextMessage.owner == message.owner {
                bubble = .normal
              } else {
                bubble = .tailed
              }
            } else {
              bubble = .tailed
            }
            cells.append(.message(message, bubbleType: bubble))
          }
        }

        if let firstEntry = entries.first {
          let title = self.configuration.dateFormatting.dateSeparatorTextProvider(firstEntry.date)
          let dateId: UUID
          switch firstEntry {
          case let .message(message):
            dateId = message.id
          case let .system(message):
            dateId = message.id
          }
          let dateCell = Cell.date(DateGroup(id: dateId, date: firstEntry.date, title: title))
          cells.insert(dateCell, at: 0)
        }

        return cells
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
    case let .image(source, isLocallyStored: _):
        .image(source)
    case let .text(text):
        .text(text)
    }
  }
  
  private func convert(_ data: RawMessage.Data) -> Message.Data {
    switch data {
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
    case let .system(text):
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

  private func deduplicatePreservingOrder(_ rawMessages: [RawMessage]) -> [RawMessage] {
    var result: [RawMessage] = []
    result.reserveCapacity(rawMessages.count)
    var indexById: [UUID: Int] = [:]
    for message in rawMessages {
      if let index = indexById[message.id] {
        result[index] = message
      } else {
        indexById[message.id] = result.count
        result.append(message)
      }
    }
    return result
  }
}

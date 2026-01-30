//
// RNChatContainer.swift
// chat-ios
//
// Created by Andrei on 17.01.2026.
//

import Foundation
import React
import UIKit

final class RNChatContainer: UIView {
  let hostViewController: ChatHostViewController
  
  @objc var userId: Int = 0 {
    didSet { hostViewController.userId = userId }
  }
  
  @objc var configuration: NSDictionary? {
    didSet {
      guard let configuration else { return }
      let parsed = parseConfiguration(configuration, base: hostViewController.configuration)
      hostViewController.configuration = parsed
    }
  }
  
  @objc var messages: NSArray? {
    didSet {
      guard let messages else { return }
      let parsed = (messages as? [Any])?.compactMap { RNChatParsing.rawMessage(from: $0) } ?? []
      hostViewController.setMessages(parsed, animated: false)
    }
  }
  
  @objc var directionalLockEnabled: Bool = false {
    didSet { hostViewController.chatViewController.setDirectionalLockEnabled(directionalLockEnabled) }
  }
  @objc var keyboardDismissMode: String = "interactive" {
    didSet {
      switch keyboardDismissMode {
      case "on-drag":
        hostViewController.chatViewController.setKeyboardDismissMode(.onDrag)
      case "interactive":
        hostViewController.chatViewController.setKeyboardDismissMode(.interactive)
      default:
        hostViewController.chatViewController.setKeyboardDismissMode(.none)
      }
    }
  }
  
  @objc var keyboardScrollOffset: NSNumber = 0 {
    didSet { hostViewController.chatViewController.setKeyboardScrollOffset(CGFloat(keyboardScrollOffset.doubleValue)) }
  }
  
  @objc var insets: NSDictionary? {
    didSet {
      guard let insets else {
        return
      }
      
      let values = UIEdgeInsets(
        top: value(from: insets, key: "top") ?? 0,
        left: value(from: insets, key: "left") ?? 0,
        bottom: value(from: insets, key: "bottom") ?? 0,
        right: value(from: insets, key: "right") ?? 0
      )
      hostViewController.chatViewController.setAdditionalInsets(values)
    }
  }
  
  @objc var scrollsToTop: Bool = true {
    didSet { hostViewController.chatViewController.setScrollsToTop(scrollsToTop) }
  }
  
  @objc var showsVerticalScrollIndicator: Bool = true {
    didSet { hostViewController.chatViewController.setShowsVerticalScrollIndicator(showsVerticalScrollIndicator) }
  }
  
  @objc var scrollEnabled: Bool = true {
    didSet { hostViewController.chatViewController.setScrollEnabled(scrollEnabled) }
  }
  
  @objc var initialScrollId: String? {
    didSet {
      if let idString = initialScrollId, let uuid = UUID(uuidString: idString) {
        hostViewController.chatViewController.initialScrollId = uuid
      }
    }
  }
  
  @objc var initialScrollIndex: NSNumber? {
    didSet { hostViewController.chatViewController.initialScrollIndex = initialScrollIndex?.intValue }
  }
  
  @objc var initialScrollOffset: NSNumber? {
    didSet { hostViewController.chatViewController.initialScrollOffset = initialScrollOffset.map { CGFloat($0.doubleValue) } }
  }
  
  @objc var initialScrollDate: NSNumber? {
    didSet {
      if let timestamp = initialScrollDate?.doubleValue {
        hostViewController.chatViewController.initialScrollDate = Date(timeIntervalSince1970: timestamp / 1000.0)
      }
    }
  }
  
  // Events
  @objc var onVisibleMessages: RCTDirectEventBlock?
  @objc var onLoadPreviousMessages: RCTDirectEventBlock?
  @objc var onForwardMessage: RCTDirectEventBlock?
  @objc var onFavoriteMessage: RCTDirectEventBlock?
  @objc var onReplyToMessage: RCTDirectEventBlock?
  @objc var onDeleteMessage: RCTDirectEventBlock?
  
  @objc var onScroll: RCTDirectEventBlock?
  @objc var onScrollBeginDrag: RCTDirectEventBlock?
  @objc var onScrollEndDrag: RCTDirectEventBlock?
  @objc var onMomentumScrollEnd: RCTDirectEventBlock?
  @objc var onScrollAnimationEnd: RCTDirectEventBlock?
  
  override init(frame: CGRect) {
    self.hostViewController = ChatHostViewController(configuration: .default)
    super.init(frame: frame)
    hostViewController.delegate = self
    hostViewController.userId = userId
    attachIfNeeded()
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()
    hostViewController.view.frame = bounds
  }
  
  override func didMoveToWindow() {
    super.didMoveToWindow()
    attachIfNeeded()
  }
  
  override func removeFromSuperview() {
    if hostViewController.parent != nil {
      hostViewController.willMove(toParent: nil)
      hostViewController.view.removeFromSuperview()
      hostViewController.removeFromParent()
    } else {
      hostViewController.view.removeFromSuperview()
    }
    super.removeFromSuperview()
  }
  
  private func attachIfNeeded() {
    guard hostViewController.view.superview == nil else { return }
    if let parent = findParentViewController() {
      parent.addChild(hostViewController)
      addSubview(hostViewController.view)
      hostViewController.view.frame = bounds
      hostViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      hostViewController.didMove(toParent: parent)
    } else {
      addSubview(hostViewController.view)
      hostViewController.view.frame = bounds
      hostViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    }
  }
  
  private func findParentViewController() -> UIViewController? {
    var responder: UIResponder? = self
    while let current = responder {
      if let viewController = current as? UIViewController {
        return viewController
      }
      responder = current.next
    }
    return nil
  }
  
  private func parseConfiguration(_ dict: NSDictionary, base: ChatConfiguration) -> ChatConfiguration {
    var config = base
    
    if let layout = dict["layout"] as? [String: Any] {
      if let value = layout["maxMessageWidthRatio"] as? CGFloat { config.layout.maxMessageWidthRatio = value }
      if let value = layout["tailSize"] as? CGFloat { config.layout.tailSize = value }
      if let value = layout["bubbleCornerRadius"] as? CGFloat { config.layout.bubbleCornerRadius = value }
      if let value = layout["interItemSpacing"] as? CGFloat { config.layout.interItemSpacing = value }
      if let value = layout["interSectionSpacing"] as? CGFloat { config.layout.interSectionSpacing = value }
      if let insets = RNChatParsing.insets(from: layout["bubbleContentInsets"]) { config.layout.bubbleContentInsets = insets }
      if let insets = RNChatParsing.insets(from: layout["dateSeparatorInsets"]) { config.layout.dateSeparatorInsets = insets }
      if let insets = RNChatParsing.insets(from: layout["mediaOverlayInsets"]) { config.layout.mediaOverlayInsets = insets }
      if let insets = RNChatParsing.insets(from: layout["systemMessageInsets"]) { config.layout.systemMessageInsets = insets }
      if let insets = RNChatParsing.insets(from: layout["replyPreviewInsets"]) { config.layout.replyPreviewInsets = insets }
    }
    
    if let colors = dict["colors"] as? [String: Any] {
      if let value = RNChatParsing.color(from: colors["background"]) { config.colors.background = value }
      if let value = RNChatParsing.color(from: colors["incomingBubble"]) { config.colors.incomingBubble = value }
      if let value = RNChatParsing.color(from: colors["outgoingBubble"]) { config.colors.outgoingBubble = value }
      if let value = RNChatParsing.color(from: colors["incomingText"]) { config.colors.incomingText = value }
      if let value = RNChatParsing.color(from: colors["outgoingText"]) { config.colors.outgoingText = value }
      if let value = RNChatParsing.color(from: colors["incomingLink"]) { config.colors.incomingLink = value }
      if let value = RNChatParsing.color(from: colors["outgoingLink"]) { config.colors.outgoingLink = value }
      if let value = RNChatParsing.color(from: colors["dateSeparatorText"]) { config.colors.dateSeparatorText = value }
      if let value = RNChatParsing.color(from: colors["dateSeparatorBorder"]) { config.colors.dateSeparatorBorder = value }
      if let value = RNChatParsing.color(from: colors["dateSeparatorBackground"]) { config.colors.dateSeparatorBackground = value }
      if let value = RNChatParsing.color(from: colors["messageSenderText"]) { config.colors.messageSenderText = value }
      if let value = RNChatParsing.color(from: colors["messageTimeText"]) { config.colors.messageTimeText = value }
      if let value = RNChatParsing.color(from: colors["mediaOverlayBackground"]) { config.colors.mediaOverlayBackground = value }
      if let value = RNChatParsing.color(from: colors["statusSent"]) { config.colors.statusSent = value }
      if let value = RNChatParsing.color(from: colors["statusReceived"]) { config.colors.statusReceived = value }
      if let value = RNChatParsing.color(from: colors["statusRead"]) { config.colors.statusRead = value }
      if let value = RNChatParsing.color(from: colors["mediaPlaceholderBackground"]) { config.colors.mediaPlaceholderBackground = value }
      if let value = RNChatParsing.color(from: colors["systemMessageText"]) { config.colors.systemMessageText = value }
      if let value = RNChatParsing.color(from: colors["systemMessageBackground"]) { config.colors.systemMessageBackground = value }
      if let value = RNChatParsing.color(from: colors["systemMessageBorder"]) { config.colors.systemMessageBorder = value }
      if let value = RNChatParsing.color(from: colors["replyPreviewBackground"]) { config.colors.replyPreviewBackground = value }
      if let value = RNChatParsing.color(from: colors["replyPreviewText"]) { config.colors.replyPreviewText = value }
      if let value = RNChatParsing.color(from: colors["replyPreviewSenderText"]) { config.colors.replyPreviewSenderText = value }
      if let value = RNChatParsing.color(from: colors["replyPreviewBorder"]) { config.colors.replyPreviewBorder = value }
      if let value = RNChatParsing.color(from: colors["scrollHighlight"]) { config.colors.scrollHighlight = value }
    }
    
    if let fonts = dict["fonts"] as? [String: Any] {
      config.fonts.message = RNChatParsing.font(from: fonts["message"], fallback: config.fonts.message)
      config.fonts.dateSeparator = RNChatParsing.font(from: fonts["dateSeparator"], fallback: config.fonts.dateSeparator)
      config.fonts.groupTitle = RNChatParsing.font(from: fonts["groupTitle"], fallback: config.fonts.groupTitle)
      config.fonts.messageSender = RNChatParsing.font(from: fonts["messageSender"], fallback: config.fonts.messageSender)
      config.fonts.messageStatus = RNChatParsing.font(from: fonts["messageStatus"], fallback: config.fonts.messageStatus)
      config.fonts.messageTime = RNChatParsing.font(from: fonts["messageTime"], fallback: config.fonts.messageTime)
      config.fonts.systemMessage = RNChatParsing.font(from: fonts["systemMessage"], fallback: config.fonts.systemMessage)
    }
    
    if let behavior = dict["behavior"] as? [String: Any] {
      if let value = behavior["showsBubbleTail"] as? Bool { config.behavior.showsBubbleTail = value }
      if let value = behavior["nameDisplayMode"] as? String {
        switch value {
        case "always":
          config.behavior.nameDisplayMode = .always
        case "none":
          config.behavior.nameDisplayMode = .none
        default:
          config.behavior.nameDisplayMode = .first
        }
      }
      if let value = behavior["showsStatus"] as? Bool { config.behavior.showsStatus = value }
      if let value = behavior["unsupportedMessageText"] as? String { config.behavior.unsupportedMessageText = value }
      if let value = behavior["showsMessageTime"] as? Bool { config.behavior.showsMessageTime = value }
      if let value = behavior["showsReplyPreview"] as? Bool { config.behavior.showsReplyPreview = value }
      if let value = behavior["showsScrollHighlight"] as? Bool { config.behavior.showsScrollHighlight = value }
      if let value = behavior["scrollHighlightDuration"] as? NSNumber { config.behavior.scrollHighlightDuration = value.doubleValue }
    }
    
    if let viewability = dict["viewability"] as? [String: Any] {
      if let value = viewability["minimumViewTime"] as? TimeInterval { config.viewability.minimumViewTime = value }
      if let value = viewability["viewAreaCoveragePercentThreshold"] as? CGFloat { config.viewability.viewAreaCoveragePercentThreshold = value }
      if let value = viewability["itemVisiblePercentThreshold"] as? CGFloat { config.viewability.itemVisiblePercentThreshold = value }
      if let value = viewability["waitForInteraction"] as? Bool { config.viewability.waitForInteraction = value }
    }
    
    if let dateFormatting = dict["dateFormatting"] as? [String: Any] {
      let locale = (dateFormatting["locale"] as? String).flatMap { Locale(identifier: $0) }
      if let format = dateFormatting["dateSeparatorFormat"] as? String {
        config.dateFormatting.dateSeparatorTextProvider = { date in
          let formatter = DateFormatter()
          formatter.locale = locale ?? Locale.current
          formatter.dateFormat = format
          return formatter.string(from: date)
        }
      }
      if let format = dateFormatting["messageTimeFormat"] as? String {
        config.dateFormatting.messageTimeProvider = { date in
          let formatter = DateFormatter()
          formatter.locale = locale ?? Locale.current
          formatter.dateFormat = format
          return formatter.string(from: date)
        }
      }
    }
    
    return config
  }
  
  private func value(from dict: NSDictionary, key: String) -> CGFloat? {
    if let number = dict[key] as? NSNumber {
      return CGFloat(number.doubleValue)
    }
    if let value = dict[key] as? CGFloat {
      return value
    }
    return nil
  }
}

extension RNChatContainer: ChatControllerDelegate {
  func onVisibleMessages(_ messageIds: [UUID]) {
    onVisibleMessages?(["messageIds": messageIds.map { $0.uuidString }])
  }
  
  func onLoadPreviousMessages(completion: @escaping () -> Void) {
    onLoadPreviousMessages?([:])
    completion()
  }
  
  func onForwardMessage(messageId: UUID) {
    onForwardMessage?(["messageId": messageId.uuidString])
  }
  
  func onFavoriteMessage(messageId: UUID) {
    onFavoriteMessage?(["messageId": messageId.uuidString])
  }
  
  func onReplyToMessage(messageId: UUID) {
    onReplyToMessage?(["messageId": messageId.uuidString])
  }
  
  func onDeleteMessage(messageId: UUID) {
    onDeleteMessage?(["messageId": messageId.uuidString])
  }
  
  func onScrollMessages(offset: CGPoint, contentSize: CGSize) {
    onScroll?([
      "contentOffset": ["x": offset.x, "y": offset.y],
      "contentSize": ["width": contentSize.width, "height": contentSize.height]
    ])
  }
  
  func onScrollMessagesBeginDrag() {
    onScrollBeginDrag?([:])
  }
  
  func onScrollMessagesEndDrag() {
    onScrollEndDrag?([:])
  }
  
  func onMomentumScrollMessagesEnd() {
    onMomentumScrollEnd?([:])
  }
  
  func onScrollMessagesAnimationEnd() {
    onScrollAnimationEnd?([:])
  }
}

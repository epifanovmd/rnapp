import Foundation
import React
import UIKit

class RNChatContainer: UIView {
    private var chatViewController: ChatViewController?
    private var chatController: ChatController?
    
    @objc var userId: Int = 0 {
        didSet {
          setupChatIfNeeded()
        }
    }
  
    @objc var directionalLockEnabled: Bool = false {
        didSet { chatViewController?.setDirectionalLockEnabled(directionalLockEnabled) }
    }
    @objc var keyboardDismissMode: String = "interactive" {
        didSet {
          switch keyboardDismissMode {
          case "on-drag": chatViewController?.setKeyboardDismissMode(.onDrag)
          case "interactive": chatViewController?.setKeyboardDismissMode(.interactive)
          default: chatViewController?.setKeyboardDismissMode(.none)
          }
        }
    }
  
    @objc var scrollsToTop: Bool = true {
        didSet { chatViewController?.setScrollsToTop(scrollsToTop) }
    }
  
    @objc var showsVerticalScrollIndicator: Bool = true {
        didSet { chatViewController?.setShowsVerticalScrollIndicator(showsVerticalScrollIndicator) }
    }
  
    @objc var scrollEnabled: Bool = true {
        didSet { chatViewController?.setScrollEnabled(scrollEnabled) }
    }

    @objc var initialScrollId: String? {
        didSet {
            if let idString = initialScrollId, let uuid = UUID(uuidString: idString) {
                chatViewController?.initialScrollId = uuid
            }
        }
    }

    @objc var initialScrollIndex: NSNumber? {
        didSet { chatViewController?.initialScrollIndex = initialScrollIndex?.intValue }
    }

    @objc var initialScrollOffset: NSNumber? {
        didSet { chatViewController?.initialScrollOffset = initialScrollOffset.map { CGFloat($0.doubleValue) } }
    }
  
    @objc var initialScrollDate: NSNumber? {
        didSet {
            if let timestamp = initialScrollDate?.doubleValue {
                // React Native обычно присылает миллисекунды
                chatViewController?.initialScrollDate = Date(timeIntervalSince1970: timestamp / 1000.0)
            }
        }
    }
    
    // События для передачи в JS
    @objc var onVisibleMessages: RCTDirectEventBlock?
    @objc var onLoadPreviousMessages: RCTDirectEventBlock?
    @objc var onDeleteMessage: RCTDirectEventBlock?
  
    @objc var onScroll: RCTDirectEventBlock?
    @objc var onScrollBeginDrag: RCTDirectEventBlock?
    @objc var onScrollEndDrag: RCTDirectEventBlock?
    @objc var onMomentumScrollEnd: RCTDirectEventBlock?
    @objc var onScrollAnimationEnd: RCTDirectEventBlock?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
    }
    
    private func setupChatIfNeeded() {
        let module = ChatModuleBuilder.build(userId: userId, delegate: self)
        self.chatViewController = module.viewController
        self.chatController = module.controller
        
        guard let chatView = chatViewController?.view else {
            print("❌ Не удалось получить view из chatViewController")
            return
        }
        self.addSubview(chatView)
        chatView.frame = self.bounds
        chatView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    }

    func getChatController() -> ChatController? {
        return chatController
    }
  
    func getChatViewController() -> ChatViewController? {
        return chatViewController
    }

    override func removeFromSuperview() {
        chatViewController?.view.removeFromSuperview()
        chatViewController = nil
        chatController = nil
        super.removeFromSuperview()
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
    self.onScrollBeginDrag?([:])
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

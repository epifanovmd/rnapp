//
// ChatHostViewController.swift
// chat-ios
//
// Created by Andrei on 17.01.2026.
//

import Foundation
import UIKit

final class ChatHostViewController: UIViewController {
    let chatViewController: ChatViewController
    let chatController: ChatController
    
    var delegate: ChatControllerDelegate? {
        didSet {
            chatViewController.delegate = delegate
        }
    }
    
    var userId: Int? {
        didSet {
            chatController.userId = userId
        }
    }
    
    var configuration: ChatConfiguration {
        didSet {
            chatController.configuration = configuration
            chatViewController.apply(configuration: configuration)
            view.backgroundColor = configuration.colors.background
        }
    }
    
    init(configuration: ChatConfiguration = .default) {
        let module = ChatModuleBuilder.build(configuration: configuration)
        self.chatViewController = module.viewController
        self.chatController = module.controller
        self.configuration = configuration
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = configuration.colors.background
        setupChildChat()
    }
    
    func setMessages(_ messages: [RawMessage], animated: Bool = true) {
        chatController.setMessages(messages, animated)
    }
    
    func appendMessages(_ messages: [RawMessage], animated: Bool = true) {
        chatController.appendMessages(messages, animated)
    }
    
    func deleteMessage(id: UUID) {
        chatController.deleteMessage(with: id)
    }
    
    func markMessagesAsRead(_ ids: [UUID]) {
        chatController.markMessagesAsRead(ids: ids)
    }
    
    func markMessagesAsReceived(_ ids: [UUID]) {
        chatController.markMessagesAsReceived(ids: ids)
    }
    
    private func setupChildChat() {
        addChild(chatViewController)
        view.addSubview(chatViewController.view)
        chatViewController.view.frame = view.bounds
        chatViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        chatViewController.didMove(toParent: self)
    }
}

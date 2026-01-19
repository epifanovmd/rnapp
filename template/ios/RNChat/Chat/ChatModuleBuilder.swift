//
//  ChatModuleBuilder.swift
//  chat-ios
//
//  Created by Andrei on 17.01.2026.
//

import UIKit

final class ChatModuleBuilder {
  static func build() -> (viewController: ChatViewController, controller: ChatController) {
    let controller = DefaultChatController()
    let dataSource = DefaultChatCollectionDataSource()
    let viewController = ChatViewController(dataSource: dataSource)
    
    controller.delegate = viewController
    
    return (viewController: viewController, controller: controller)
  }
}


//
//  ChatModuleBuilder.swift
//  chat-ios
//
//  Created by Andrei on 17.01.2026.
//

import UIKit

final class ChatModuleBuilder {
  static func build(configuration: ChatConfiguration = .default) -> (viewController: ChatViewController, controller: ChatController) {
    let controller = DefaultChatController(configuration: configuration)
    let dataSource = DefaultChatCollectionDataSource(configuration: configuration)
    let viewController = ChatViewController(dataSource: dataSource, configuration: configuration)
    
    controller.delegate = viewController
    dataSource.onReloadMessage = { [weak controller] messageId in
      controller?.reloadMessage(with: messageId)
    }
    
    return (viewController: viewController, controller: controller)
  }
}

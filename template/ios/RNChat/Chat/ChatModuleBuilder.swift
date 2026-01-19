//
//  ChatModuleBuilder.swift
//  chat-ios
//
//  Created by Andrei on 17.01.2026.
//

import UIKit

final class ChatModuleBuilder {
    static func build(userId: Int, delegate: ChatControllerDelegate? = nil) -> (viewController: ChatViewController, controller: ChatController) {
        let controller = DefaultChatController(userId: userId)
        let dataSource = DefaultChatCollectionDataSource()
        let viewController = ChatViewController(dataSource: dataSource)

        controller.delegate = viewController
        viewController.delegate = delegate

        return (viewController: viewController, controller: controller)
    }
}


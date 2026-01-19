//
// ChatLayout
// ChatControllerDelegate.swift
// https://github.com/ekazaev/ChatLayout
//
// Created by Eugene Kazaev in 2020-2026.
// Distributed under the MIT license.
//
// Become a sponsor:
// https://github.com/sponsors/ekazaev
//

import Foundation

protocol ChatViewControllerDelegate: AnyObject {
    func update(with sections: [Section], requiresIsolatedProcess: Bool)
    func update(with sections: [Section], requiresIsolatedProcess: Bool, animated: Bool)
}

//
// ChatLayout
// Constants.swift
// https://github.com/ekazaev/ChatLayout
//
// Created by Eugene Kazaev in 2020-2026.
// Distributed under the MIT license.
//
// Become a sponsor:
// https://github.com/sponsors/ekazaev
//

import Foundation
import UIKit

public struct Constants {
  static let tailSize: CGFloat = 5
  
  static let maxWidth: CGFloat = 0.65
  
  public struct ViewabilityConfig {
    /// Минимальное время (в сек), которое элемент должен быть виден
    var minimumViewTime: TimeInterval = 0.5
    
    /// Какой процент видимой области экрана должен занимать элемент (0-100)
    var viewAreaCoveragePercentThreshold: CGFloat = 0
    
    /// Какой процент самого элемента должен быть виден (0-100)
    var itemVisiblePercentThreshold: CGFloat = 50
    
    /// Ждать ли взаимодействия пользователя (скролла) перед началом отслеживания
    var waitForInteraction: Bool = false
  }
  
  private init() {}
}

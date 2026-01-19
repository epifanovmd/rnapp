//
// ChatLayout
// ChatDateFormatter.swift
// https://github.com/ekazaev/ChatLayout
//
// Created by Eugene Kazaev in 2020-2026.
// Distributed under the MIT license.
//
// Become a sponsor:
// https://github.com/sponsors/ekazaev
//

import Foundation

public final class ChatDateFormatter {
    // MARK: - Properties

    public static let shared = ChatDateFormatter()

    private let formatter = DateFormatter()

    // MARK: - Initializer

    private init() {}

    // MARK: - Methods

    public func string(from date: Date) -> String {
       configure(for: date)
       return formatter.string(from: date)
   }

    public func attributedString(from date: Date, with attributes: [NSAttributedString.Key: Any]) -> NSAttributedString {
        let dateString = string(from: date)
        return NSAttributedString(string: dateString, attributes: attributes)
    }

    private func configure(for date: Date) {
        let calendar = Calendar.current
//        formatter.locale = Locale(identifier: "ru_RU")
        formatter.locale = Locale.current

        formatter.doesRelativeDateFormatting = false

        if calendar.isDateInToday(date) || calendar.isDateInYesterday(date) {
            formatter.doesRelativeDateFormatting = true
            formatter.dateStyle = .medium
            formatter.timeStyle = .none
        } else {
            let isCurrentYear = calendar.component(.year, from: date) == calendar.component(.year, from: Date())

            if isCurrentYear {
                formatter.dateFormat = "dd MMMM"
            } else {
                formatter.dateFormat = "dd MMMM yyyy"
            }
        }
    }
}

public final class MessageDateFormatter {
    public static let shared = MessageDateFormatter()

    private let formatter = DateFormatter()

    private init() {
        formatter.doesRelativeDateFormatting = true
        formatter.dateStyle = .none
        formatter.timeStyle = .short
    }

    public func string(from date: Date) -> String {
        formatter.string(from: date)
    }

    public func attributedString(from date: Date, with attributes: [NSAttributedString.Key: Any]) -> NSAttributedString {
        let dateString = string(from: date)
        return NSAttributedString(string: dateString, attributes: attributes)
    }
}

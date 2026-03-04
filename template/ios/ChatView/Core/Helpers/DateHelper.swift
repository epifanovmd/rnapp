// MARK: - DateHelper.swift
// Форматирование дат для UI чата.
// Использует локаль устройства для всех пользовательских строк.
// Парсинг ключей секций всегда использует en_US_POSIX для стабильности.

import Foundation

final class DateHelper {

    static let shared = DateHelper()
    private init() {}

    // MARK: - Formatters

    /// HH:mm — время в подписи сообщения. Локаль устройства.
    private let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale     = .current
        f.dateFormat = "HH:mm"
        return f
    }()

    /// Читаемая дата для заголовка секции (medium style). Локаль устройства.
    private let sectionFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale     = .current
        f.dateStyle  = .medium
        f.timeStyle  = .none
        return f
    }()

    /// День недели (EEEE). Локаль устройства.
    private let weekdayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale     = .current
        f.dateFormat = "EEEE"
        return f
    }()

    /// Парсинг ключей секций "yyyy-MM-dd". Фиксированная локаль — не зависит от устройства.
    private let groupParser: DateFormatter = {
        let f = DateFormatter()
        f.locale     = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    // MARK: - Public API

    /// Возвращает строку времени в формате "HH:mm" для подписи сообщения.
    func timeString(from date: Date) -> String {
        timeFormatter.string(from: date)
    }

    /// Возвращает локализованный заголовок секции по ключу "yyyy-MM-dd".
    /// Примеры: "Сегодня", "Вчера", "Понедельник", "14 мар. 2024 г."
    func sectionTitle(from dateKey: String) -> String {
        guard let date = groupParser.date(from: dateKey) else { return dateKey }
        let cal = Calendar.current
        if cal.isDateInToday(date)     { return localizedToday() }
        if cal.isDateInYesterday(date) { return localizedYesterday() }
        if let diff = cal.dateComponents([.day], from: date, to: Date()).day,
           diff < 7 {
            return weekdayFormatter.string(from: date).capitalized
        }
        return sectionFormatter.string(from: date)
    }

    // MARK: - Private helpers

    /// Локализованная строка "Сегодня" / "Today" / etc. по локали устройства.
    private func localizedToday() -> String {
        // Используем RelativeDateTimeFormatter для правильной локализации
        let f = RelativeDateTimeFormatter()
        f.locale      = .current
        f.dateTimeStyle = .named
        f.unitsStyle  = .full
        // "сегодня" = 0 секунд разницы
        return f.localizedString(from: DateComponents(day: 0))
    }

    private func localizedYesterday() -> String {
        let f = RelativeDateTimeFormatter()
        f.locale      = .current
        f.dateTimeStyle = .named
        f.unitsStyle  = .full
        return f.localizedString(from: DateComponents(day: -1))
    }
}

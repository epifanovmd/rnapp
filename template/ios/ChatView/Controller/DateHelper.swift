// MARK: - DateHelper.swift
// Форматирование дат для UI чата.
//
// Ключевые правила:
//   • Все DateFormatter получают locale из preferredLocale() — первый язык
//     из списка предпочтений пользователя (Настройки → Основные → Язык и регион).
//   • Парсинг ключей секций ("yyyy-MM-dd") всегда использует en_US_POSIX —
//     эти строки технические, не пользовательские.
//   • "Сегодня" / "Вчера" берутся через doesRelativeDateFormatting — это
//     единственный корректно локализованный способ на всех версиях iOS.

import Foundation

final class DateHelper {

    static let shared = DateHelper()
    private init() {}

    // MARK: - Preferred locale
    // Берём первый язык из списка предпочтений пользователя.
    // Locale.current может возвращать регион без языка (например "en_RU"),
    // поэтому используем preferredLanguages для точности.

    private static func preferredLocale() -> Locale {
        guard let langCode = Locale.preferredLanguages.first else { return .current }
        return Locale(identifier: langCode)
    }

    // MARK: - Formatters

    /// HH:mm — время в подписи сообщения.
    private let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale     = DateHelper.preferredLocale()
        f.dateFormat = "HH:mm"
        return f
    }()

    /// Дата с годом — для сообщений из прошлых лет ("5 мар. 2023 г." / "Mar 5, 2023").
    private let sectionFormatterWithYear: DateFormatter = {
        let f = DateFormatter()
        f.locale    = DateHelper.preferredLocale()
        f.dateStyle = .medium
        f.timeStyle = .none
        return f
    }()

    /// Дата без года — для сообщений текущего года ("5 мар." / "Mar 5").
    /// dateFormat(fromTemplate:) расставляет разделители и порядок компонентов
    /// по правилам конкретной локали — безопаснее хардкода формата.
    private let sectionFormatterCurrentYear: DateFormatter = {
        let f = DateFormatter()
        f.locale     = DateHelper.preferredLocale()
        f.dateFormat = DateFormatter.dateFormat(
            fromTemplate: "dMMM",
            options: 0,
            locale: DateHelper.preferredLocale()
        )
        return f
    }()

    /// День недели полностью (EEEE): "понедельник", "Monday" и т.д.
    private let weekdayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale     = DateHelper.preferredLocale()
        f.dateFormat = "EEEE"
        return f
    }()

    /// Парсинг технических ключей "yyyy-MM-dd". Фиксированная локаль — стабильность.
    private let groupParser: DateFormatter = {
        let f = DateFormatter()
        f.locale     = Locale(identifier: "en_US_POSIX")
        f.timeZone   = TimeZone(secondsFromGMT: 0)
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    /// Кэшированный форматтер с doesRelativeDateFormatting — создаётся один раз.
    /// Используется для получения строк "Сегодня"/"Вчера" в нужной локали.
    private lazy var relativeDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale                    = DateHelper.preferredLocale()
        f.dateStyle                 = .medium
        f.timeStyle                 = .none
        f.doesRelativeDateFormatting = true
        return f
    }()

    // MARK: - Локализованные строки "Сегодня" / "Вчера"
    // Используем doesRelativeDateFormatting — это стандартный системный механизм,
    // который корректно локализует относительные даты на всех версиях iOS.

    private lazy var todayString: String = {
        relativeDateFormatter.string(from: Date())
    }()

    private lazy var yesterdayString: String = {
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date()
        return relativeDateFormatter.string(from: yesterday)
    }()

    // MARK: - Public API

    /// Строка времени "HH:mm" для footer пузыря.
    func timeString(from date: Date) -> String {
        timeFormatter.string(from: date)
    }

    /// Локализованный заголовок секции по ключу "yyyy-MM-dd".
    ///
    /// Логика (от частного к общему):
    ///   1. Сегодня / Вчера
    ///   2. Текущая неделя → день недели ("Понедельник" / "Monday")
    ///   3. Текущий год   → число + месяц без года ("5 мар." / "Mar 5")
    ///   4. Прошлые годы  → полная дата с годом ("5 мар. 2023 г." / "Mar 5, 2023")
    func sectionTitle(from dateKey: String) -> String {
        guard let date = groupParser.date(from: dateKey) else { return dateKey }
        let cal = Calendar.current

        if cal.isDateInToday(date)     { return todayString }
        if cal.isDateInYesterday(date) { return yesterdayString }

        // Текущая неделя — день недели с заглавной буквы
        if let diff = cal.dateComponents([.day], from: date, to: Date()).day, diff < 7 {
            let weekday = weekdayFormatter.string(from: date)
            // Только первый символ заглавным — capitalized ломает CJK/арабский
            return weekday.prefix(1).uppercased() + weekday.dropFirst()
        }

        // Текущий год — число и месяц без года
        let currentYear = cal.component(.year, from: Date())
        let dateYear    = cal.component(.year, from: date)
        if dateYear == currentYear {
            return sectionFormatterCurrentYear.string(from: date)
        }

        // Прошлые годы — полная дата с годом
        return sectionFormatterWithYear.string(from: date)
    }
}

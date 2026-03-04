// MARK: - DateHelper.swift
// Форматирование дат для UI чата.
//
// Ключевые правила:
//   • Все DateFormatter получают locale из preferredLocale() — первый язык
//     из списка предпочтений пользователя (Настройки → Основные → Язык и регион).
//   • Парсинг ключей секций ("yyyy-MM-dd") всегда использует en_US_POSIX —
//     эти строки технические, не пользовательские.
//   • "Сегодня" / "Вчера" берутся из Calendar.current через стандартный
//     DateFormatter с .dateStyle = .full, а затем сравниваются — это
//     гарантирует правильную локализацию без хаков с RelativeDateTimeFormatter,
//     который на ряде версий iOS игнорирует locale при .named стиле.

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

    // MARK: - Локализованные строки "Сегодня" / "Вчера"
    // Формируем через DateFormatter с .full стилем и вырезаем нужную часть —
    // надёжнее RelativeDateTimeFormatter на всех версиях iOS.

    private lazy var todayString: String     = makeDayLabel(daysAgo: 0)
    private lazy var yesterdayString: String = makeDayLabel(daysAgo: 1)

    /// Строит локализованный лейбл "сегодня"/"вчера" для нужной локали.
    private func makeDayLabel(daysAgo: Int) -> String {
        // Используем стандартный способ: форматируем дату и берём только день
        let cal  = Calendar.current
        guard let date = cal.date(byAdding: .day, value: -daysAgo, to: Date()) else { return "" }

        // DateFormatter с .full возвращает строки типа
        // "среда, 5 марта 2025 г." (ru) / "Wednesday, March 5, 2025" (en)
        // — надёжный способ получить локализованный день без хаков.
        let f = DateFormatter()
        f.locale    = DateHelper.preferredLocale()
        f.dateStyle = .full
        f.timeStyle = .none

        // Для "сегодня"/"вчера" iOS предоставляет doesRelativeDateFormatting
        let rel = DateFormatter()
        rel.locale                   = DateHelper.preferredLocale()
        rel.dateStyle                = .medium
        rel.timeStyle                = .none
        rel.doesRelativeDateFormatting = true
        return rel.string(from: date)
    }

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

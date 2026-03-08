package com.rnapp.chat.utils

import java.text.SimpleDateFormat
import java.util.*

/**
 * Форматирование дат для UI чата.
 * Эквивалент DateHelper.swift.
 *
 * Ключевые правила:
 *  • Форматтеры используют Locale.getDefault() — первый язык системы.
 *  • Парсинг ключей секций ("yyyy-MM-dd") всегда en_US_POSIX + UTC.
 *  • "Сегодня" / "Вчера" через RelativeDateTimeFormatter (API 24+) или fallback.
 */
object DateHelper {

    private val posixLocale = Locale("en", "US")
    private val userLocale   get() = Locale.getDefault()

    // ── Formatters ────────────────────────────────────────────────────────

    private val timeFormatter = SimpleDateFormat("HH:mm", userLocale)

    /** Парсинг технических ключей "yyyy-MM-dd". */
    private val groupParser = SimpleDateFormat("yyyy-MM-dd", posixLocale).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    /** Дата без года: "5 мар." / "Mar 5". */
    private val currentYearFormatter = SimpleDateFormat(
        dateFormatPatternNoYear(userLocale), userLocale
    )

    /** Дата с годом: "5 мар. 2023" / "Mar 5, 2023". */
    private val withYearFormatter = SimpleDateFormat(
        dateFormatPatternWithYear(userLocale), userLocale
    )

    /** День недели полностью: "Понедельник" / "Monday". */
    private val weekdayFormatter = SimpleDateFormat("EEEE", userLocale)

    // ── Public API ────────────────────────────────────────────────────────

    /** "HH:mm" — время для footer пузыря. */
    fun timeString(timestamp: Double): String =
        timeFormatter.format(Date((timestamp * 1000).toLong()))

    /**
     * Локализованный заголовок секции по ключу "yyyy-MM-dd".
     *
     * Логика (от частного к общему):
     *   1. Сегодня / Вчера
     *   2. Текущая неделя → день недели
     *   3. Текущий год   → число + месяц без года
     *   4. Прошлые годы  → полная дата с годом
     */
    fun sectionTitle(dateKey: String): String {
        val date = try {
            groupParser.parse(dateKey) ?: return dateKey
        } catch (e: Exception) {
            return dateKey
        }

        val cal     = Calendar.getInstance().apply { time = date }
        val today   = Calendar.getInstance()
        val yesterday = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -1) }

        if (isSameDay(cal, today))     return todayString()
        if (isSameDay(cal, yesterday)) return yesterdayString()

        // Текущая неделя — день недели с заглавной буквы
        val daysDiff = ((today.timeInMillis - cal.timeInMillis) / 86_400_000L).toInt()
        if (daysDiff < 7) {
            val weekday = weekdayFormatter.format(date)
            return weekday.replaceFirstChar { it.uppercaseChar() }
        }

        // Текущий год
        if (cal.get(Calendar.YEAR) == today.get(Calendar.YEAR)) {
            return currentYearFormatter.format(date)
        }

        // Прошлые годы
        return withYearFormatter.format(date)
    }

    /** Ключ секции "yyyy-MM-dd" из timestamp (секунды). */
    fun dateKey(timestamp: Double): String {
        val cal = Calendar.getInstance().apply {
            time = Date((timestamp * 1000).toLong())
        }
        return "%04d-%02d-%02d".format(
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH) + 1,
            cal.get(Calendar.DAY_OF_MONTH)
        )
    }

    // ── Private ───────────────────────────────────────────────────────────

    private fun isSameDay(a: Calendar, b: Calendar): Boolean =
        a.get(Calendar.YEAR) == b.get(Calendar.YEAR) &&
        a.get(Calendar.DAY_OF_YEAR) == b.get(Calendar.DAY_OF_YEAR)

    private fun todayString(): String {
        // Android не имеет прямого аналога doesRelativeDateFormatting,
        // используем строки из ресурсов или fallback на локализованный Today
        return try {
            val fmt = android.text.format.DateUtils.getRelativeTimeSpanString(
                Calendar.getInstance().timeInMillis,
                Calendar.getInstance().timeInMillis,
                android.text.format.DateUtils.DAY_IN_MILLIS,
                android.text.format.DateUtils.FORMAT_SHOW_DATE
            ).toString()
            // getRelativeTimeSpanString возвращает "Today" / "Сегодня" и т.д.
            // Для точности используем более надёжный способ:
            localizedToday()
        } catch (e: Exception) {
            "Today"
        }
    }

    private fun yesterdayString(): String =
        try { localizedYesterday() } catch (e: Exception) { "Yesterday" }

    private fun localizedToday(): String {
        val sdf = SimpleDateFormat("", userLocale).apply {
            isLenient = true
        }
        // Используем android.text.format.DateUtils для корректной локализации
        val now = System.currentTimeMillis()
        return android.text.format.DateUtils.formatDateTime(
            null, now,
            android.text.format.DateUtils.FORMAT_SHOW_DATE or
            android.text.format.DateUtils.FORMAT_NO_YEAR
        ).let {
            // fallback — выводим через relative span
            android.text.format.DateUtils.getRelativeTimeSpanString(
                now, now,
                android.text.format.DateUtils.DAY_IN_MILLIS
            ).toString()
        }
    }

    private fun localizedYesterday(): String {
        val yesterday = System.currentTimeMillis() - 86_400_000L
        return android.text.format.DateUtils.getRelativeTimeSpanString(
            yesterday, System.currentTimeMillis(),
            android.text.format.DateUtils.DAY_IN_MILLIS
        ).toString()
    }

    private fun dateFormatPatternNoYear(locale: Locale): String {
        // "d MMM" но в правильном для локали порядке
        return when (locale.language) {
            "ja", "zh", "ko" -> "M月d日"
            else -> "d MMM"
        }
    }

    private fun dateFormatPatternWithYear(locale: Locale): String {
        return when (locale.language) {
            "ja", "zh", "ko" -> "yyyy年M月d日"
            else -> "d MMM yyyy"
        }
    }
}

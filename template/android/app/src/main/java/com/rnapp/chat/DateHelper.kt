package com.rnapp.chat.utils

import android.content.Context
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Хелпер для форматирования дат в чате.
 * Зеркалит DateHelper.swift.
 *
 * dateKey()      — "yyyy-MM-dd" ключ секции
 * sectionTitle() — локализованный заголовок секции ("Today", "Yesterday", "Monday", "12 Jan 2024")
 * timeString()   — время сообщения ("14:32")
 */
object DateHelper {

    private val dateKeyFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
        timeZone = TimeZone.getDefault()
    }

    private val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault()).apply {
        timeZone = TimeZone.getDefault()
    }

    private val dayOfWeekFormat = SimpleDateFormat("EEEE", Locale.getDefault()).apply {
        timeZone = TimeZone.getDefault()
    }

    private val shortDateFormat = SimpleDateFormat("d MMM yyyy", Locale.getDefault()).apply {
        timeZone = TimeZone.getDefault()
    }

    /**
     * Ключ секции из Unix timestamp (секунды).
     * Формат: "yyyy-MM-dd"
     */
    fun dateKey(timestampSeconds: Double): String =
        dateKeyFormat.format(Date((timestampSeconds * 1000).toLong()))

    /**
     * Локализованный заголовок секции из dateKey.
     * Зеркалит sectionTitle() из DateHelper.swift.
     */
    fun sectionTitle(context: Context, dateKey: String): String {
        val date = dateKeyFormat.parse(dateKey) ?: return dateKey

        val today     = calendarDay(System.currentTimeMillis())
        val msgDay    = calendarDay(date.time)

        val diffDays  = today - msgDay

        return when {
            diffDays == 0L   -> "Today"
            diffDays == 1L   -> "Yesterday"
            diffDays < 7L    -> dayOfWeekFormat.format(date)   // "Monday", "Tuesday"…
            else             -> shortDateFormat.format(date)   // "12 Jan 2024"
        }
    }

    /**
     * Форматирует время сообщения из Unix timestamp (секунды).
     * Формат: "HH:mm"
     */
    fun timeString(timestampSeconds: Double): String =
        timeFormat.format(Date((timestampSeconds * 1000).toLong()))

    // ─── Private ──────────────────────────────────────────────────────────────

    /** Возвращает число дней с эпохи в локальном часовом поясе. */
    private fun calendarDay(epochMillis: Long): Long {
        val cal = Calendar.getInstance()
        cal.timeInMillis = epochMillis
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.timeInMillis / (24 * 60 * 60 * 1000L)
    }
}

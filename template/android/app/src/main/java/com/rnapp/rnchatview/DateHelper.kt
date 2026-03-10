package com.rnapp.rnchatview

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

// ─── DateHelper ───────────────────────────────────────────────────────────────
//
// Синглтон для форматирования дат в чате.
// Кэширует форматтеры — создавать их дорого.

object DateHelper {

    private val timeFormatter      = SimpleDateFormat("HH:mm", Locale.getDefault())
    private val fullDateFormatter  = SimpleDateFormat("d MMMM yyyy", Locale.getDefault())
    private val sectionKeyFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    /** Форматирует время сообщения: "14:25" */
    fun timeString(from: Long): String = timeFormatter.format(Date(from))

    /** Заголовок секции: "Today", "Yesterday", "5 January 2024" */
    fun sectionTitle(from: String): String {
        val date = sectionKeyFormatter.parse(from) ?: return from
        val cal  = Calendar.getInstance().apply { time = date }
        val now  = Calendar.getInstance()

        return when {
            isSameDay(cal, now) -> "Today"
            isYesterday(cal, now) -> "Yesterday"
            cal.get(Calendar.YEAR) == now.get(Calendar.YEAR) -> {
                val fmt = SimpleDateFormat("d MMMM", Locale.getDefault())
                fmt.format(date)
            }
            else -> fullDateFormatter.format(date)
        }
    }

    /** Ключ секции из Unix ms */
    fun groupDateKey(timestampMs: Long): String =
        sectionKeyFormatter.format(Date(timestampMs))

    private fun isSameDay(a: Calendar, b: Calendar): Boolean =
        a.get(Calendar.YEAR)         == b.get(Calendar.YEAR) &&
        a.get(Calendar.DAY_OF_YEAR)  == b.get(Calendar.DAY_OF_YEAR)

    private fun isYesterday(a: Calendar, b: Calendar): Boolean {
        val yesterday = Calendar.getInstance().apply {
            time = b.time
            add(Calendar.DAY_OF_YEAR, -1)
        }
        return isSameDay(a, yesterday)
    }
}

package com.rnapp.rnchatview

import android.text.format.DateUtils
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object DateHelper {

    private val timeFormatter get() = SimpleDateFormat("HH:mm", Locale.getDefault())
    private val fullDateFormatter get() = SimpleDateFormat("d MMMM yyyy", Locale.getDefault())
    private val shortDateFormatter get() = SimpleDateFormat("d MMMM", Locale.getDefault())
    private val sectionKeyFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    /** Форматирует время сообщения в строку вида "14:25". */
    fun timeString(from: Long): String = timeFormatter.format(Date(from))

    /**
     * Возвращает заголовок секции на языке устройства:
     * "Сегодня" / "Вчера" / "5 мая" / "5 мая 2023".
     */
    fun sectionTitle(from: String): String {
        val date = sectionKeyFormatter.parse(from) ?: return from
        val cal = Calendar.getInstance().apply { time = date }
        val now = Calendar.getInstance()

        return when {
            isSameDay(cal, now) || isYesterday(cal, now) ->
                DateUtils.getRelativeTimeSpanString(
                    date.time,
                    System.currentTimeMillis(),
                    DateUtils.DAY_IN_MILLIS,
                ).toString()
            cal.get(Calendar.YEAR) == now.get(Calendar.YEAR) -> shortDateFormatter.format(date)
            else -> fullDateFormatter.format(date)
        }
    }

    /** Возвращает ключ секции из Unix-timestamp в миллисекундах. */
    fun groupDateKey(timestampMs: Long): String =
        sectionKeyFormatter.format(Date(timestampMs))

    private fun isSameDay(a: Calendar, b: Calendar): Boolean =
        a.get(Calendar.YEAR) == b.get(Calendar.YEAR) &&
                a.get(Calendar.DAY_OF_YEAR) == b.get(Calendar.DAY_OF_YEAR)

    private fun isYesterday(a: Calendar, b: Calendar): Boolean {
        val yesterday = Calendar.getInstance().apply {
            time = b.time
            add(Calendar.DAY_OF_YEAR, -1)
        }
        return isSameDay(a, yesterday)
    }
}

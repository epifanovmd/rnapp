package com.rnapp.chat.adapter

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.rnapp.chat.model.ChatListItem
import com.rnapp.chat.theme.ChatLayoutConstants
import com.rnapp.chat.theme.ChatTheme
import com.rnapp.chat.utils.dpToPx
import com.rnapp.chat.utils.spToPx

/**
 * ItemDecoration для sticky date headers.
 *
 * Поведение:
 *  • Заголовок текущей секции "прилипает" к верху RecyclerView.
 *  • При появлении следующего заголовка предыдущий "выталкивается" вверх.
 *  • Рисуется на Canvas поверх RecyclerView — не мешает скроллу.
 *
 * Алгоритм:
 *  1. Находим первый видимый элемент.
 *  2. Ищем ближайший DateHeader сверху (index <= firstVisible).
 *  3. Рисуем его как sticky header в top=0.
 *  4. Если следующий DateHeader почти достиг sticky позиции —
 *     сдвигаем sticky header вверх, создавая эффект "выталкивания".
 */
class StickyHeaderDecoration(
    private val adapter: ChatAdapter,
    private var theme: ChatTheme,
) : RecyclerView.ItemDecoration() {

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { textAlign = Paint.Align.CENTER }

    fun updateTheme(newTheme: ChatTheme) { theme = newTheme }

    override fun onDrawOver(c: Canvas, parent: RecyclerView, state: RecyclerView.State) {
        val layoutManager = parent.layoutManager as? LinearLayoutManager ?: return
        val firstVisible  = layoutManager.findFirstVisibleItemPosition()
        if (firstVisible == RecyclerView.NO_POSITION) return

        val stickyIndex = findStickyHeaderIndex(firstVisible) ?: return
        val stickyItem  = adapter.getItem(stickyIndex) as? ChatListItem.DateHeader ?: return

        val ctx       = parent.context
        val headerH   = ChatLayoutConstants.DATE_SEPARATOR_HEIGHT_DP.dpToPx(ctx)
        val vMargin   = ChatLayoutConstants.DATE_SEPARATOR_STICKY_MARGIN.dpToPx(ctx)
        val hPad      = ChatLayoutConstants.DATE_SEPARATOR_H_PADDING_DP.dpToPx(ctx)
        val cornerR   = ChatLayoutConstants.DATE_SEPARATOR_CORNER_DP.dpToPx(ctx).toFloat()

        // Ищем следующий DateHeader ниже stickyIndex
        val nextHeaderIndex  = findNextHeaderIndex(stickyIndex)
        var topOffset        = 0f

        if (nextHeaderIndex != null) {
            val nextView = layoutManager.findViewByPosition(nextHeaderIndex)
            if (nextView != null) {
                // Если следующий заголовок "доезжает" до sticky позиции — выталкиваем
                val nextTop = nextView.top
                if (nextTop < headerH + vMargin * 2) {
                    topOffset = (nextTop - headerH - vMargin * 2).toFloat()
                }
            }
        }

        // Measure text
        val text = stickyItem.label
        textPaint.textSize  = ChatLayoutConstants.DATE_SEPARATOR_TEXT_SIZE_SP.spToPx(ctx)
        textPaint.color     = theme.dateSeparatorText
        val textW = textPaint.measureText(text)

        val totalW   = textW + hPad * 2
        val left     = (parent.width - totalW) / 2f
        val top      = vMargin + topOffset
        val right    = left + totalW
        val bottom   = top + headerH

        // Draw background
        paint.color = theme.dateSeparatorBackground
        c.drawRoundRect(RectF(left, top, right, bottom), cornerR, cornerR, paint)

        // Draw text
        val textY = top + headerH / 2f - (textPaint.descent() + textPaint.ascent()) / 2f
        c.drawText(text, parent.width / 2f, textY, textPaint)
    }

    private fun findStickyHeaderIndex(firstVisible: Int): Int? {
        for (i in firstVisible downTo 0) {
            if (adapter.getItem(i) is ChatListItem.DateHeader) return i
        }
        return null
    }

    private fun findNextHeaderIndex(current: Int): Int? {
        for (i in (current + 1) until adapter.itemCount) {
            if (adapter.getItem(i) is ChatListItem.DateHeader) return i
        }
        return null
    }
}

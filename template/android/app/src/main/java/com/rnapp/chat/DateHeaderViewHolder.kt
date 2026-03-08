package com.rnapp.chat.viewholder

import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.rnapp.chat.model.ChatListItem
import com.rnapp.chat.theme.ChatLayoutConstants
import com.rnapp.chat.theme.ChatTheme
import com.rnapp.chat.utils.dpToPx
import com.rnapp.chat.utils.dpToPxF
import com.rnapp.chat.utils.spToPx

/**
 * ViewHolder для разделителя даты.
 *
 * Рисуется StickyHeaderDecoration поверх RecyclerView (sticky behavior).
 * Сам ViewHolder показывает "обычную" версию header для позиций ниже
 * sticky области (чтобы RecyclerView резервировал корректную высоту).
 *
 * Структура:
 *  FrameLayout (root, MATCH_PARENT × DATE_SEPARATOR_HEIGHT_DP + vMargin*2)
 *   └─ TextView (label, centered, скруглённый фон)
 */
class DateHeaderViewHolder private constructor(
    private val root: FrameLayout,
    private val label: TextView,
) : RecyclerView.ViewHolder(root) {

    fun bind(item: ChatListItem.DateHeader, theme: ChatTheme) {
        label.text = item.label
        applyTheme(theme)
    }

    fun applyTheme(theme: ChatTheme) {
        val ctx    = root.context
        val corner = ChatLayoutConstants.DATE_SEPARATOR_CORNER_DP.dpToPxF(ctx)
        label.background = GradientDrawable().apply {
            shape        = GradientDrawable.RECTANGLE
            cornerRadius = corner
            setColor(theme.dateSeparatorBackground)
        }
        label.setTextColor(theme.dateSeparatorText)
    }

    companion object {

        fun create(parent: ViewGroup, theme: ChatTheme): DateHeaderViewHolder {
            val ctx = parent.context

            val headerH  = ChatLayoutConstants.DATE_SEPARATOR_HEIGHT_DP.dpToPx(ctx)
            val vMargin  = ChatLayoutConstants.DATE_SEPARATOR_STICKY_MARGIN.dpToPx(ctx)
            val hPad     = ChatLayoutConstants.DATE_SEPARATOR_H_PADDING_DP.dpToPx(ctx)

            val label = TextView(ctx).apply {
                textSize = ChatLayoutConstants.DATE_SEPARATOR_TEXT_SIZE_SP
                gravity  = Gravity.CENTER
                setPadding(hPad, 0, hPad, 0)
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, headerH, Gravity.CENTER
                )
            }

            val root = FrameLayout(ctx).apply {
                layoutParams = RecyclerView.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    headerH + vMargin * 2
                )
                addView(label)
            }

            return DateHeaderViewHolder(root, label).also { it.applyTheme(theme) }
        }
    }
}

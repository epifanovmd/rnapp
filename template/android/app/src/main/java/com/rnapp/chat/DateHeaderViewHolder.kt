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

/**
 * ViewHolder для разделителя дат.
 * itemView = FrameLayout (container), label — дочерний TextView.
 * label создаётся до передачи в super(), container создаётся
 * внутри createContainer() и принимает label через addView — это корректно,
 * т.к. в super() передаётся container, а не label.
 */
class DateHeaderViewHolder private constructor(
    private val label: TextView,
    private var theme: ChatTheme,
    container: FrameLayout,
) : RecyclerView.ViewHolder(container) {

    fun bind(item: ChatListItem.DateHeader) {
        label.text = item.label
        applyTheme()
    }

    fun updateTheme(newTheme: ChatTheme) {
        theme = newTheme
        applyTheme()
    }

    private fun applyTheme() {
        val ctx = label.context
        label.background = GradientDrawable().apply {
            shape        = GradientDrawable.RECTANGLE
            cornerRadius = ChatLayoutConstants.DATE_SEPARATOR_CORNER_DP.dpToPx(ctx).toFloat()
            setColor(theme.dateSeparatorBackground)
        }
        label.setTextColor(theme.dateSeparatorText)
    }

    companion object {
        fun create(parent: ViewGroup, theme: ChatTheme): DateHeaderViewHolder {
            val ctx  = parent.context
            val hPad = ChatLayoutConstants.DATE_SEPARATOR_H_PADDING_DP.dpToPx(ctx)
            val vPad = ChatLayoutConstants.CELL_VERTICAL_PADDING_DP.dpToPx(ctx)
            val h    = ChatLayoutConstants.DATE_SEPARATOR_HEIGHT_DP.dpToPx(ctx)

            // label создаётся отдельно — ещё не attached ни к чему
            val label = TextView(ctx).apply {
                textSize = ChatLayoutConstants.DATE_SEPARATOR_TEXT_SIZE_SP
                gravity  = Gravity.CENTER
                setPadding(hPad, 0, hPad, 0)
            }

            // container создаётся и сразу принимает label
            val container = FrameLayout(ctx).apply {
                layoutParams = RecyclerView.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    h + vPad * 2,
                )
                addView(label, FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, h, Gravity.CENTER
                ))
            }

            // В super() передаётся container — label уже его дочерний,
            // но сам container ещё не attached к parent → краша нет
            return DateHeaderViewHolder(label, theme, container)
        }
    }
}

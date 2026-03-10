package com.rnapp.chat.inputbar

import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.util.AttributeSet
import android.view.Gravity
import android.view.View
import android.widget.*
import com.rnapp.chat.theme.ChatLayoutConstants
import com.rnapp.chat.theme.ChatTheme
import com.rnapp.chat.utils.dpToPx
import com.rnapp.chat.utils.dpToPxF

/**
 * InputBarView — только строка ввода (attach + editText + send).
 * Панель reply/edit — отдельный ReplyPanelView в ChatView, который
 * располагается над InputBarView и двигает его через translationY.
 */
class InputBarView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : LinearLayout(context, attrs) {

    var onSendClick: ((text: String) -> Unit)?  = null
    var onAttachClick: (() -> Unit)?             = null

    val editText: EditText
    private val attachButton: ImageButton
    private val sendButton: ImageButton
    private val topSeparator: View

    private var currentTheme: ChatTheme = ChatTheme.light

    init {
        orientation = VERTICAL

        fun dp(v: Float): Int = v.dpToPx(context)

        topSeparator = View(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, 1)
        }
        addView(topSeparator)

        val iconSize = dp(ChatLayoutConstants.INPUT_BAR_ICON_SIZE_DP)
        val iconPad  = dp(ChatLayoutConstants.INPUT_BAR_ICON_PADDING_DP)
        val vPad     = dp(ChatLayoutConstants.INPUT_BAR_VERTICAL_PADDING_DP)

        attachButton = ImageButton(context).apply {
            setImageResource(android.R.drawable.ic_menu_add)
            background = null
            layoutParams = LayoutParams(iconSize + iconPad * 2, LayoutParams.MATCH_PARENT)
            setPadding(iconPad, 0, iconPad, 0)
            setOnClickListener { onAttachClick?.invoke() }
        }

        editText = EditText(context).apply {
            hint     = "Message…"
            minLines = 1
            maxLines = 5
            textSize = ChatLayoutConstants.MESSAGE_TEXT_SIZE_SP
            background = null
            setPadding(0, vPad, 0, vPad)
            layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f)
        }

        sendButton = ImageButton(context).apply {
            setImageResource(android.R.drawable.ic_menu_send)
            background = null
            layoutParams = LayoutParams(iconSize + iconPad * 2, LayoutParams.MATCH_PARENT)
            setPadding(iconPad, 0, iconPad, 0)
            setOnClickListener {
                val text = editText.text.toString().trim()
                if (text.isNotEmpty()) { onSendClick?.invoke(text); editText.setText("") }
            }
        }

        val inputRow = LinearLayout(context).apply {
            orientation  = HORIZONTAL
            gravity      = Gravity.CENTER_VERTICAL
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
                topMargin    = vPad / 2
                bottomMargin = vPad / 2
            }
            addView(attachButton)
            val editContainer = FrameLayout(context).apply {
                layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f)
                val p = dp(ChatLayoutConstants.BUBBLE_HORIZONTAL_PAD_DP)
                editText.layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT
                ).apply { marginStart = p; marginEnd = p }
                addView(editText)
            }
            addView(editContainer)
            addView(sendButton)
        }
        addView(inputRow)

        applyTheme(currentTheme)
    }

    fun applyTheme(theme: ChatTheme) {
        currentTheme = theme
        setBackgroundColor(theme.inputBarBackground)
        topSeparator.setBackgroundColor(theme.inputBarSeparator)
        editText.setTextColor(theme.inputBarText)
        editText.setHintTextColor(theme.inputBarPlaceholder)
        attachButton.setColorFilter(theme.inputBarTint)
        sendButton.setColorFilter(theme.inputBarTint)

        val parent = editText.parent as? FrameLayout
        parent?.background = GradientDrawable().apply {
            shape        = GradientDrawable.RECTANGLE
            cornerRadius = ChatLayoutConstants.INPUT_BAR_CORNER_RADIUS_DP.dpToPxF(context)
            setColor(theme.inputBarTextViewBg)
        }
    }
}

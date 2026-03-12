package com.rnapp.rncontextmenu

import android.graphics.Color
import android.graphics.RectF

data class ContextMenuAction(
    val id: String,
    val title: String,
    val systemImage: String? = null,
    val isDestructive: Boolean = false,
)

data class ContextMenuLayout(
    val snapTarget: RectF,
    val emojiTarget: RectF,
    val actionsTarget: RectF,
    val snapOrigin: RectF,
    val emojiOrigin: RectF,
    val actionsOrigin: RectF,
    val hasEmoji: Boolean,
    val hasActions: Boolean,
    val canvasH: Float,
    val needsScroll: Boolean,
    val scrollOffset: Float,
)

data class SizePair(val w: Float, val h: Float)

class ContextMenuTheme(isDark: Boolean) {
    val backdropColor: Int = if (isDark) Color.argb(128, 0, 0, 0) else Color.argb(77, 0, 0, 0)
    val emojiPanelBackground: Int = if (isDark) Color.rgb(38, 38, 40) else Color.WHITE
    val emojiPanelCornerRadius: Int = 16
    val emojiFontSize: Float = 20f
    val emojiItemSize: Int = 36
    val menuBackground: Int = if (isDark) Color.rgb(38, 38, 40) else Color.WHITE
    val menuCornerRadius: Int = 12
    val separatorColor: Int = if (isDark) Color.argb(31, 255, 255, 255) else Color.argb(31, 0, 0, 0)
    val actionTitleColor: Int = if (isDark) Color.rgb(235, 235, 235) else Color.BLACK
    val actionDestructiveColor: Int = Color.rgb(255, 59, 48)
    val actionHighlightColor: Int = if (isDark) Color.argb(60, 255, 255, 255) else Color.argb(30, 0, 0, 0)
    val actionItemHeight: Int = 48
    val actionHorizontalPadding: Int = 14
    val openDuration: Double = 0.40
    val closeDuration: Double = 0.26
    val emojiPanelSpacing: Float = 6f
    val menuSpacing: Float = 6f
    val horizontalPadding: Float = 12f
    val verticalPadding: Float = 10f
    val menuWidth: Int = 220
}

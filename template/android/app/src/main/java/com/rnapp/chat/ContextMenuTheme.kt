package com.rnapp.chat.theme

import android.graphics.Color
import androidx.annotation.ColorInt

/**
 * Визуальные настройки кастомного контекстного меню.
 * Эквивалент ContextMenuTheme.swift.
 */
data class ContextMenuTheme(

    // ── Backdrop ──────────────────────────────────────────────────────────
    @ColorInt val backdropColor: Int,
    val backdropBlurRadius: Float,  // px, для RenderScript/Blur

    // ── Emoji panel ───────────────────────────────────────────────────────
    @ColorInt val emojiPanelBackground: Int,
    val emojiPanelCornerRadius: Float,
    @ColorInt val emojiPanelShadowColor: Int,
    val emojiPanelShadowAlpha: Float,
    val emojiPanelShadowRadius: Float,
    val emojiFontSizeSp: Float,
    val emojiItemSizeDp: Float,

    // ── Action menu ───────────────────────────────────────────────────────
    @ColorInt val menuBackground: Int,
    val menuCornerRadius: Float,
    @ColorInt val menuShadowColor: Int,
    val menuShadowAlpha: Float,
    val menuShadowRadius: Float,
    @ColorInt val menuSeparatorColor: Int,
    val actionTitleSizeSp: Float,
    @ColorInt val actionTitleColor: Int,
    @ColorInt val actionDestructiveTitleColor: Int,
    @ColorInt val actionIconColor: Int,
    @ColorInt val actionDestructiveIconColor: Int,
    val actionItemHeightDp: Float,
    val actionHorizontalPaddingDp: Float,
    @ColorInt val actionHighlightColor: Int,

    // ── Animation ─────────────────────────────────────────────────────────
    val openDurationMs: Long,
    val closeDurationMs: Long,
    val springDamping: Float,
    val springStiffness: Float,

    // ── Layout ────────────────────────────────────────────────────────────
    val emojiPanelSpacingDp: Float,
    val menuSpacingDp: Float,
    val horizontalPaddingDp: Float,
    val verticalPaddingDp: Float,
    val menuWidthDp: Float,
) {
    companion object {

        val light = ContextMenuTheme(
            backdropColor             = Color.argb(76, 0, 0, 0),
            backdropBlurRadius        = 20f,
            emojiPanelBackground      = Color.WHITE,
            emojiPanelCornerRadius    = 20f,
            emojiPanelShadowColor     = Color.BLACK,
            emojiPanelShadowAlpha     = 0.10f,
            emojiPanelShadowRadius    = 12f,
            emojiFontSizeSp           = 22f,
            emojiItemSizeDp           = 42f,
            menuBackground            = Color.WHITE,
            menuCornerRadius          = 12f,
            menuShadowColor           = Color.BLACK,
            menuShadowAlpha           = 0.10f,
            menuShadowRadius          = 16f,
            menuSeparatorColor        = Color.argb(128, 0, 0, 0),
            actionTitleSizeSp         = 15f,
            actionTitleColor          = Color.rgb(20, 20, 20),
            actionDestructiveTitleColor = Color.rgb(255, 59, 48),
            actionIconColor           = Color.rgb(20, 20, 20),
            actionDestructiveIconColor = Color.rgb(255, 59, 48),
            actionItemHeightDp        = 48f,
            actionHorizontalPaddingDp = 14f,
            actionHighlightColor      = Color.rgb(229, 229, 234),
            openDurationMs            = 350L,
            closeDurationMs           = 220L,
            springDamping             = 0.82f,
            springStiffness           = 400f,
            emojiPanelSpacingDp       = 6f,
            menuSpacingDp             = 6f,
            horizontalPaddingDp       = 12f,
            verticalPaddingDp         = 10f,
            menuWidthDp               = 220f,
        )

        val dark = ContextMenuTheme(
            backdropColor             = Color.argb(128, 0, 0, 0),
            backdropBlurRadius        = 20f,
            emojiPanelBackground      = Color.rgb(38, 38, 38),
            emojiPanelCornerRadius    = 20f,
            emojiPanelShadowColor     = Color.BLACK,
            emojiPanelShadowAlpha     = 0.35f,
            emojiPanelShadowRadius    = 16f,
            emojiFontSizeSp           = 22f,
            emojiItemSizeDp           = 42f,
            menuBackground            = Color.rgb(38, 38, 38),
            menuCornerRadius          = 12f,
            menuShadowColor           = Color.BLACK,
            menuShadowAlpha           = 0.45f,
            menuShadowRadius          = 20f,
            menuSeparatorColor        = Color.argb(31, 255, 255, 255),
            actionTitleSizeSp         = 15f,
            actionTitleColor          = Color.rgb(235, 235, 235),
            actionDestructiveTitleColor = Color.rgb(255, 89, 89),
            actionIconColor           = Color.rgb(235, 235, 235),
            actionDestructiveIconColor = Color.rgb(255, 89, 89),
            actionItemHeightDp        = 48f,
            actionHorizontalPaddingDp = 14f,
            actionHighlightColor      = Color.rgb(64, 64, 64),
            openDurationMs            = 350L,
            closeDurationMs           = 220L,
            springDamping             = 0.82f,
            springStiffness           = 400f,
            emojiPanelSpacingDp       = 6f,
            menuSpacingDp             = 6f,
            horizontalPaddingDp       = 12f,
            verticalPaddingDp         = 10f,
            menuWidthDp               = 220f,
        )
    }
}

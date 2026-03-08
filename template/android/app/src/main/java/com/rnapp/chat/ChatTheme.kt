package com.rnapp.chat.theme

import android.graphics.Color
import android.graphics.Typeface
import androidx.annotation.ColorInt

/**
 * Единственная точка истины для всех визуальных настроек чата.
 * Эквивалент ChatTheme.swift.
 */
data class ChatTheme(

    // ── Bubble: исходящие ──────────────────────────────────────────────────
    @ColorInt val outgoingBubbleColor: Int,
    @ColorInt val outgoingTextColor: Int,
    @ColorInt val outgoingTimeColor: Int,
    @ColorInt val outgoingStatusColor: Int,
    @ColorInt val outgoingStatusReadColor: Int,
    @ColorInt val outgoingEditedColor: Int,

    // ── Bubble: входящие ───────────────────────────────────────────────────
    @ColorInt val incomingBubbleColor: Int,
    @ColorInt val incomingTextColor: Int,
    @ColorInt val incomingTimeColor: Int,
    @ColorInt val incomingEditedColor: Int,

    // ── Reply inside bubble: исходящие ─────────────────────────────────────
    @ColorInt val outgoingReplyBackground: Int,
    @ColorInt val outgoingReplyAccent: Int,
    @ColorInt val outgoingReplySender: Int,
    @ColorInt val outgoingReplyText: Int,

    // ── Reply inside bubble: входящие ─────────────────────────────────────
    @ColorInt val incomingReplyBackground: Int,
    @ColorInt val incomingReplyAccent: Int,
    @ColorInt val incomingReplySender: Int,
    @ColorInt val incomingReplyText: Int,

    // ── Input bar ──────────────────────────────────────────────────────────
    @ColorInt val inputBarBackground: Int,
    @ColorInt val inputBarSeparator: Int,
    @ColorInt val inputBarTextViewBg: Int,
    @ColorInt val inputBarPlaceholder: Int,
    @ColorInt val inputBarText: Int,
    @ColorInt val inputBarTint: Int,

    @ColorInt val replyPanelBackground: Int,
    @ColorInt val replyPanelAccent: Int,
    @ColorInt val replyPanelSender: Int,
    @ColorInt val replyPanelText: Int,
    @ColorInt val replyPanelClose: Int,

    // ── Date separator ─────────────────────────────────────────────────────
    @ColorInt val dateSeparatorBackground: Int,
    @ColorInt val dateSeparatorText: Int,

    // ── FAB ────────────────────────────────────────────────────────────────
    @ColorInt val fabBackground: Int,
    @ColorInt val fabArrowColor: Int,

    // ── Empty state ────────────────────────────────────────────────────────
    @ColorInt val emptyStateText: Int,

    // ── Background ────────────────────────────────────────────────────────
    @ColorInt val collectionViewBackground: Int,

    // ── Identity ──────────────────────────────────────────────────────────
    val isDark: Boolean,
) {
    companion object {

        val light = ChatTheme(
            outgoingBubbleColor      = Color.rgb(61, 158, 250),
            outgoingTextColor        = Color.WHITE,
            outgoingTimeColor        = Color.argb(190, 255, 255, 255),
            outgoingStatusColor      = Color.argb(178, 255, 255, 255),
            outgoingStatusReadColor  = Color.WHITE,
            outgoingEditedColor      = Color.argb(153, 255, 255, 255),

            incomingBubbleColor      = Color.rgb(240, 240, 240),
            incomingTextColor        = Color.rgb(20, 20, 20),
            incomingTimeColor        = Color.rgb(130, 130, 130),
            incomingEditedColor      = Color.rgb(130, 130, 130),

            outgoingReplyBackground  = Color.argb(51, 255, 255, 255),
            outgoingReplyAccent      = Color.argb(178, 255, 255, 255),
            outgoingReplySender      = Color.argb(230, 255, 255, 255),
            outgoingReplyText        = Color.argb(217, 255, 255, 255),

            incomingReplyBackground  = Color.argb(15, 0, 0, 0),
            incomingReplyAccent      = Color.rgb(33, 150, 243),
            incomingReplySender      = Color.rgb(33, 150, 243),
            incomingReplyText        = Color.rgb(130, 130, 130),

            inputBarBackground       = Color.WHITE,
            inputBarSeparator        = Color.argb(76, 0, 0, 0),
            inputBarTextViewBg       = Color.rgb(242, 242, 247),
            inputBarPlaceholder      = Color.rgb(180, 180, 180),
            inputBarText             = Color.rgb(20, 20, 20),
            inputBarTint             = Color.rgb(33, 150, 243),

            replyPanelBackground     = Color.WHITE,
            replyPanelAccent         = Color.rgb(33, 150, 243),
            replyPanelSender         = Color.rgb(33, 150, 243),
            replyPanelText           = Color.rgb(130, 130, 130),
            replyPanelClose          = Color.rgb(180, 180, 180),

            dateSeparatorBackground  = Color.argb(217, 242, 242, 247),
            dateSeparatorText        = Color.rgb(130, 130, 130),

            fabBackground            = Color.WHITE,
            fabArrowColor            = Color.rgb(20, 20, 20),

            emptyStateText           = Color.rgb(130, 130, 130),
            collectionViewBackground = Color.TRANSPARENT,
            isDark                   = false,
        )

        val dark = ChatTheme(
            outgoingBubbleColor      = Color.rgb(36, 115, 204),
            outgoingTextColor        = Color.WHITE,
            outgoingTimeColor        = Color.argb(166, 255, 255, 255),
            outgoingStatusColor      = Color.argb(153, 255, 255, 255),
            outgoingStatusReadColor  = Color.argb(230, 255, 255, 255),
            outgoingEditedColor      = Color.argb(128, 255, 255, 255),

            incomingBubbleColor      = Color.rgb(46, 46, 46),
            incomingTextColor        = Color.rgb(237, 237, 237),
            incomingTimeColor        = Color.rgb(140, 140, 140),
            incomingEditedColor      = Color.rgb(140, 140, 140),

            outgoingReplyBackground  = Color.argb(38, 255, 255, 255),
            outgoingReplyAccent      = Color.argb(153, 255, 255, 255),
            outgoingReplySender      = Color.argb(217, 255, 255, 255),
            outgoingReplyText        = Color.argb(191, 255, 255, 255),

            incomingReplyBackground  = Color.argb(20, 255, 255, 255),
            incomingReplyAccent      = Color.rgb(89, 153, 255),
            incomingReplySender      = Color.rgb(89, 153, 255),
            incomingReplyText        = Color.rgb(153, 153, 153),

            inputBarBackground       = Color.rgb(31, 31, 31),
            inputBarSeparator        = Color.argb(25, 255, 255, 255),
            inputBarTextViewBg       = Color.rgb(56, 56, 56),
            inputBarPlaceholder      = Color.rgb(115, 115, 115),
            inputBarText             = Color.rgb(237, 237, 237),
            inputBarTint             = Color.rgb(89, 153, 255),

            replyPanelBackground     = Color.rgb(31, 31, 31),
            replyPanelAccent         = Color.rgb(89, 153, 255),
            replyPanelSender         = Color.rgb(89, 153, 255),
            replyPanelText           = Color.rgb(153, 153, 153),
            replyPanelClose          = Color.rgb(102, 102, 102),

            dateSeparatorBackground  = Color.argb(230, 51, 51, 51),
            dateSeparatorText        = Color.rgb(153, 153, 153),

            fabBackground            = Color.rgb(46, 46, 46),
            fabArrowColor            = Color.rgb(230, 230, 230),

            emptyStateText           = Color.rgb(128, 128, 128),
            collectionViewBackground = Color.TRANSPARENT,
            isDark                   = true,
        )
    }
}

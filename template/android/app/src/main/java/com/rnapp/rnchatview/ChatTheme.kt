package com.rnapp.rnchatview

import android.graphics.Color

// ─── ChatTheme ────────────────────────────────────────────────────────────────
//
// Единственная точка истины для всех визуальных настроек чата.
// Точный аналог Swift-структуры ChatTheme.

data class ChatTheme(

    // Bubble — исходящие
    val outgoingBubbleColor: Int,
    val outgoingTextColor: Int,
    val outgoingTimeColor: Int,
    val outgoingStatusColor: Int,
    val outgoingStatusReadColor: Int,
    val outgoingEditedColor: Int,

    // Bubble — входящие
    val incomingBubbleColor: Int,
    val incomingTextColor: Int,
    val incomingTimeColor: Int,
    val incomingEditedColor: Int,

    // Reply inside bubble — outgoing
    val outgoingReplyBackground: Int,
    val outgoingReplyAccent: Int,
    val outgoingReplySender: Int,
    val outgoingReplyText: Int,

    // Reply inside bubble — incoming
    val incomingReplyBackground: Int,
    val incomingReplyAccent: Int,
    val incomingReplySender: Int,
    val incomingReplyText: Int,

    // Input bar
    val inputBarBackground: Int,
    val inputBarSeparator: Int,
    val inputBarTextViewBg: Int,
    val inputBarPlaceholder: Int,
    val inputBarText: Int,
    val inputBarTint: Int,

    // Reply panel in input bar
    val replyPanelBackground: Int,
    val replyPanelAccent: Int,
    val replyPanelSender: Int,
    val replyPanelText: Int,
    val replyPanelClose: Int,

    // Date separator
    val dateSeparatorBackground: Int,
    val dateSeparatorText: Int,

    // FAB
    val fabBackground: Int,
    val fabArrowColor: Int,

    // Empty state
    val emptyStateText: Int,

    // Background
    val collectionBackground: Int,

    // Identity
    val isDark: Boolean,
) {
    companion object {

        fun light() = ChatTheme(
            outgoingBubbleColor    = Color.rgb(61, 158, 249),      // #3D9EF9
            outgoingTextColor      = Color.WHITE,
            outgoingTimeColor      = Color.argb(191, 255, 255, 255),
            outgoingStatusColor    = Color.argb(178, 255, 255, 255),
            outgoingStatusReadColor = Color.WHITE,
            outgoingEditedColor    = Color.argb(153, 255, 255, 255),

            incomingBubbleColor    = Color.rgb(240, 240, 240),
            incomingTextColor      = Color.BLACK,
            incomingTimeColor      = Color.rgb(142, 142, 147),
            incomingEditedColor    = Color.rgb(142, 142, 147),

            outgoingReplyBackground = Color.argb(51, 255, 255, 255),
            outgoingReplyAccent    = Color.argb(178, 255, 255, 255),
            outgoingReplySender    = Color.argb(229, 255, 255, 255),
            outgoingReplyText      = Color.argb(217, 255, 255, 255),

            incomingReplyBackground = Color.argb(15, 0, 0, 0),
            incomingReplyAccent    = Color.rgb(0, 122, 255),
            incomingReplySender    = Color.rgb(0, 122, 255),
            incomingReplyText      = Color.rgb(142, 142, 147),

            inputBarBackground     = Color.WHITE,
            inputBarSeparator      = Color.argb(77, 60, 60, 67),
            inputBarTextViewBg     = Color.rgb(242, 242, 247),
            inputBarPlaceholder    = Color.rgb(199, 199, 204),
            inputBarText           = Color.BLACK,
            inputBarTint           = Color.rgb(0, 122, 255),

            replyPanelBackground   = Color.WHITE,
            replyPanelAccent       = Color.rgb(0, 122, 255),
            replyPanelSender       = Color.rgb(0, 122, 255),
            replyPanelText         = Color.rgb(142, 142, 147),
            replyPanelClose        = Color.rgb(199, 199, 204),

            dateSeparatorBackground = Color.argb(217, 242, 242, 247),
            dateSeparatorText       = Color.rgb(142, 142, 147),

            fabBackground          = Color.WHITE,
            fabArrowColor          = Color.BLACK,

            emptyStateText         = Color.rgb(142, 142, 147),
            collectionBackground   = Color.TRANSPARENT,
            isDark                 = false,
        )

        fun dark() = ChatTheme(
            outgoingBubbleColor    = Color.rgb(36, 115, 204),      // #2473CC
            outgoingTextColor      = Color.WHITE,
            outgoingTimeColor      = Color.argb(166, 255, 255, 255),
            outgoingStatusColor    = Color.argb(153, 255, 255, 255),
            outgoingStatusReadColor = Color.argb(229, 255, 255, 255),
            outgoingEditedColor    = Color.argb(128, 255, 255, 255),

            incomingBubbleColor    = Color.rgb(46, 46, 46),
            incomingTextColor      = Color.rgb(237, 237, 237),
            incomingTimeColor      = Color.rgb(140, 140, 140),
            incomingEditedColor    = Color.rgb(140, 140, 140),

            outgoingReplyBackground = Color.argb(38, 255, 255, 255),
            outgoingReplyAccent    = Color.argb(153, 255, 255, 255),
            outgoingReplySender    = Color.argb(217, 255, 255, 255),
            outgoingReplyText      = Color.argb(191, 255, 255, 255),

            incomingReplyBackground = Color.argb(20, 255, 255, 255),
            incomingReplyAccent    = Color.rgb(90, 153, 255),
            incomingReplySender    = Color.rgb(90, 153, 255),
            incomingReplyText      = Color.rgb(153, 153, 153),

            inputBarBackground     = Color.rgb(30, 30, 30),
            inputBarSeparator      = Color.argb(26, 255, 255, 255),
            inputBarTextViewBg     = Color.rgb(56, 56, 56),
            inputBarPlaceholder    = Color.rgb(114, 114, 114),
            inputBarText           = Color.rgb(237, 237, 237),
            inputBarTint           = Color.rgb(90, 153, 255),

            replyPanelBackground   = Color.rgb(30, 30, 30),
            replyPanelAccent       = Color.rgb(90, 153, 255),
            replyPanelSender       = Color.rgb(90, 153, 255),
            replyPanelText         = Color.rgb(153, 153, 153),
            replyPanelClose        = Color.rgb(102, 102, 102),

            dateSeparatorBackground = Color.argb(230, 50, 50, 50),
            dateSeparatorText       = Color.rgb(153, 153, 153),

            fabBackground          = Color.rgb(44, 44, 46),
            fabArrowColor          = Color.rgb(229, 229, 229),

            emptyStateText         = Color.rgb(128, 128, 128),
            collectionBackground   = Color.TRANSPARENT,
            isDark                 = true,
        )

        fun from(name: String?) = if (name?.lowercase() == "dark") dark() else light()
    }
}

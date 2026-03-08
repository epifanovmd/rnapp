package com.rnapp.chat.theme

/**
 * Единственная точка истины для всех размерных констант чата (dp).
 * Эквивалент ChatLayoutConstants.swift.
 * Все поля в dp — конвертируйте через dpToPx() перед использованием.
 */
object ChatLayoutConstants {

    // ── Cell ──────────────────────────────────────────────────────────────
    const val CELL_VERTICAL_PADDING_DP    = 4f
    const val CELL_SIDE_MARGIN_DP         = 8f
    const val MINIMUM_CELL_HEIGHT_DP      = 36f

    // ── Bubble shape ──────────────────────────────────────────────────────
    const val BUBBLE_CORNER_RADIUS_DP     = 16f
    /** Радиус «острого» угла пузыря (угол у края экрана). */
    const val BUBBLE_TAIL_CORNER_DP       = 4f

    // ── Bubble sizing ─────────────────────────────────────────────────────
    const val BUBBLE_MAX_WIDTH_RATIO      = 0.78f
    const val BUBBLE_HORIZONTAL_PAD_DP    = 10f   // leading + trailing
    const val BUBBLE_TOP_PAD_DP           = 6f
    const val BUBBLE_BOTTOM_PAD_DP        = 5f

    // ── Content stack ─────────────────────────────────────────────────────
    const val STACK_SPACING_DP            = 3f

    // ── Reply preview inside bubble ───────────────────────────────────────
    const val REPLY_BLOCK_HEIGHT_DP       = 46f
    const val REPLY_ACCENT_WIDTH_DP       = 3f
    const val REPLY_INNER_PADDING_DP      = 8f

    // ── Footer (time + status) ────────────────────────────────────────────
    const val FOOTER_HEIGHT_DP            = 15f
    const val FOOTER_TOP_SPACING_DP       = 2f
    const val FOOTER_TRAILING_PAD_DP      = 8f
    const val FOOTER_INTERNAL_SPACING_DP  = 3f
    const val STATUS_ICON_SIZE_DP         = 13f

    // ── Image ─────────────────────────────────────────────────────────────
    const val IMAGE_ASPECT_RATIO          = 0.6f  // height = width * ratio
    const val IMAGE_CORNER_RADIUS_DP      = 12f

    // ── Typography ────────────────────────────────────────────────────────
    const val MESSAGE_TEXT_SIZE_SP        = 15f
    const val FOOTER_TEXT_SIZE_SP         = 11f
    const val SENDER_TEXT_SIZE_SP         = 13f
    const val REPLY_SENDER_TEXT_SIZE_SP   = 12f
    const val REPLY_TEXT_SIZE_SP          = 12f

    // ── Collection spacing ────────────────────────────────────────────────
    const val LINE_SPACING_DP             = 2f
    const val COLLECTION_TOP_PADDING_DP   = 8f
    const val COLLECTION_BOTTOM_PADDING_DP = 16f

    // ── Date separator ────────────────────────────────────────────────────
    const val DATE_SEPARATOR_HEIGHT_DP      = 28f
    const val DATE_SEPARATOR_CORNER_DP      = 14f
    const val DATE_SEPARATOR_H_PADDING_DP   = 12f
    const val DATE_SEPARATOR_TEXT_SIZE_SP   = 12f
    const val DATE_SEPARATOR_STICKY_MARGIN  = 8f

    // ── InputBar ──────────────────────────────────────────────────────────
    const val INPUT_BAR_VERTICAL_PADDING_DP  = 8f
    const val INPUT_BAR_REPLY_PANEL_HEIGHT_DP = 56f
    const val INPUT_BAR_TEXT_MIN_HEIGHT_DP   = 36f
    const val INPUT_BAR_TEXT_MAX_HEIGHT_DP   = 120f
    const val INPUT_BAR_ICON_SIZE_DP         = 24f
    const val INPUT_BAR_ICON_PADDING_DP      = 12f
    const val INPUT_BAR_CORNER_RADIUS_DP     = 18f

    // ── Shadows ───────────────────────────────────────────────────────────
    const val BUBBLE_SHADOW_RADIUS_DP    = 10f
    const val BUBBLE_SHADOW_ALPHA        = 0.16f
    const val FAB_SHADOW_RADIUS_DP       = 8f
    const val FAB_SHADOW_ALPHA           = 0.18f
    const val FAB_SIZE_DP                = 44f
    const val FAB_MARGIN_DP              = 16f

    // ── Context menu ──────────────────────────────────────────────────────
    const val CONTEXT_MENU_CORNER_DP        = 12f
    const val CONTEXT_MENU_WIDTH_DP         = 220f
    const val CONTEXT_MENU_ITEM_HEIGHT_DP   = 48f
    const val CONTEXT_MENU_H_PADDING_DP     = 14f
    const val EMOJI_PANEL_CORNER_DP         = 20f
    const val EMOJI_PANEL_H_PADDING_DP      = 8f
    const val EMOJI_PANEL_V_PADDING_DP      = 8f
    const val EMOJI_ITEM_SIZE_DP            = 42f
    const val EMOJI_FONT_SIZE_SP            = 22f
    const val EMOJI_PANEL_SPACING_DP        = 6f
    const val MENU_SPACING_DP               = 6f
    const val CONTEXT_H_MARGIN_DP           = 12f
    const val CONTEXT_V_MARGIN_DP           = 10f
}

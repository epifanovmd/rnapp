package com.rnapp.rnchatview

import android.content.Context
import android.util.TypedValue
import kotlin.math.roundToInt

// ─── ChatLayoutConstants ──────────────────────────────────────────────────────
//
// Единственная точка истины для всех размерных констант чата.
// Все значения — в dp; контексто-зависимые px-варианты через Context.px().

object ChatLayoutConstants {

    // Cell
    const val CELL_VERTICAL_PADDING_DP    = 4f
    const val CELL_SIDE_MARGIN_DP         = 8f
    const val MINIMUM_CELL_HEIGHT_DP      = 36f

    // Bubble shape
    const val BUBBLE_CORNER_RADIUS_DP     = 16f

    // Bubble sizing
    const val BUBBLE_MAX_WIDTH_RATIO      = 0.78f
    const val BUBBLE_HORIZONTAL_PADDING_DP = 10f  // left + right внутри пузыря
    const val BUBBLE_TOP_PADDING_DP       = 6f
    const val BUBBLE_BOTTOM_PADDING_DP    = 5f

    // Content stack
    const val STACK_SPACING_DP            = 3f

    // Reply preview inside bubble
    const val REPLY_BLOCK_HEIGHT_DP       = 46f
    const val REPLY_BAR_WIDTH_DP          = 3f
    const val REPLY_CORNER_RADIUS_DP      = 8f

    // Footer (time + status)
    const val FOOTER_HEIGHT_DP            = 15f
    const val FOOTER_TOP_SPACING_DP       = 2f
    const val FOOTER_TRAILING_PADDING_DP  = 8f
    const val FOOTER_SPACING_DP           = 3f
    const val STATUS_ICON_SIZE_DP         = 13f

    // Message text
    const val MESSAGE_TEXT_SIZE_SP        = 15f
    const val FOOTER_TEXT_SIZE_SP         = 11f
    const val SENDER_NAME_TEXT_SIZE_SP    = 11f

    // Image
    const val IMAGE_ASPECT_RATIO          = 0.6f  // height = width * ratio

    // Collection spacing
    const val LINE_SPACING_DP             = 2f
    const val COLLECTION_TOP_PADDING_DP   = 8f
    const val COLLECTION_BOTTOM_PADDING_DP = 16f

    // Date separator
    const val DATE_SEPARATOR_HEIGHT_DP    = 36f
    const val DATE_SEPARATOR_TEXT_SIZE_SP = 12f
    const val DATE_SEPARATOR_CORNER_DP    = 10f

    // InputBar
    const val INPUT_BAR_VERTICAL_PADDING_DP   = 8f
    const val INPUT_BAR_REPLY_PANEL_HEIGHT_DP = 56f
    const val INPUT_BAR_TEXT_MIN_HEIGHT_DP    = 36f
    const val INPUT_BAR_TEXT_MAX_HEIGHT_DP    = 120f
    const val INPUT_TEXT_SIZE_SP              = 16f

    // FAB
    const val FAB_SIZE_DP                 = 40f
    const val FAB_MARGIN_END_DP           = 16f
    const val FAB_MARGIN_BOTTOM_DP        = 12f
    const val FAB_ELEVATION_DP            = 4f

    // Sender avatar
    const val AVATAR_SIZE_DP              = 32f

    // Context menu
    const val CONTEXT_MENU_CORNER_DP      = 14f
    const val CONTEXT_MENU_EMOJI_SIZE_DP  = 36f
    const val CONTEXT_MENU_ACTION_H_DP    = 44f
}

// ─── Context extension ────────────────────────────────────────────────────────

fun Context.dpToPx(dp: Float): Int =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, resources.displayMetrics)
        .roundToInt()

fun Context.spToPx(sp: Float): Float =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, sp, resources.displayMetrics)

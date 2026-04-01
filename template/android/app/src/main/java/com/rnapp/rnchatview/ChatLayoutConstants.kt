package com.rnapp.rnchatview

import android.content.Context
import android.util.TypedValue
import kotlin.math.roundToInt

object ChatLayoutConstants {
    const val CELL_VERTICAL_PADDING_DP = 4f
    const val CELL_SIDE_MARGIN_DP = 8f
    const val MINIMUM_CELL_HEIGHT_DP = 36f
    const val BUBBLE_CORNER_RADIUS_DP = 16f
    const val BUBBLE_MAX_WIDTH_RATIO = 0.78f
    const val BUBBLE_HORIZONTAL_PADDING_DP = 10f
    const val BUBBLE_TOP_PADDING_DP = 6f
    const val BUBBLE_BOTTOM_PADDING_DP = 5f
    const val STACK_SPACING_DP = 3f
    const val REPLY_BLOCK_HEIGHT_DP = 46f
    const val REPLY_BAR_WIDTH_DP = 3f
    const val REPLY_CORNER_RADIUS_DP = 8f
    const val FOOTER_HEIGHT_DP = 15f
    const val FOOTER_TOP_SPACING_DP = 2f
    const val FOOTER_TRAILING_PADDING_DP = 8f
    const val FOOTER_SPACING_DP = 3f
    const val STATUS_ICON_SIZE_DP = 13f
    const val MESSAGE_TEXT_SIZE_SP = 15f
    const val FOOTER_TEXT_SIZE_SP = 11f
    const val SENDER_NAME_TEXT_SIZE_SP = 11f
    const val IMAGE_ASPECT_RATIO = 0.6f
    const val LINE_SPACING_DP = 2f
    const val COLLECTION_TOP_PADDING_DP = 8f
    const val COLLECTION_BOTTOM_PADDING_DP = 16f
    const val DATE_SEPARATOR_HEIGHT_DP = 36f
    const val DATE_SEPARATOR_TEXT_SIZE_SP = 12f
    const val DATE_SEPARATOR_CORNER_DP = 10f
    const val INPUT_BAR_VERTICAL_PADDING_DP = 8f
    const val INPUT_BAR_REPLY_PANEL_HEIGHT_DP = 56f
    const val INPUT_BAR_TEXT_MIN_HEIGHT_DP = 36f
    const val INPUT_BAR_TEXT_MAX_HEIGHT_DP = 120f
    const val INPUT_TEXT_SIZE_SP = 16f
    const val FAB_SIZE_DP = 40f
    const val FAB_MARGIN_END_DP = 16f
    const val FAB_MARGIN_BOTTOM_DP = 12f
    const val FAB_ELEVATION_DP = 4f
    const val AVATAR_SIZE_DP = 32f
    const val CONTEXT_MENU_CORNER_DP = 14f
    const val CONTEXT_MENU_EMOJI_SIZE_DP = 36f
    const val CONTEXT_MENU_ACTION_H_DP = 44f

    // Video overlay
    const val VIDEO_PLAY_BUTTON_SIZE_DP = 48f
    const val VIDEO_DURATION_TEXT_SIZE_SP = 12f
    const val VIDEO_DURATION_PAD_H_DP = 6f
    const val VIDEO_DURATION_PAD_V_DP = 3f
    const val VIDEO_DURATION_CORNER_DP = 8f

    // Emoji-only
    const val EMOJI_ONLY_TEXT_SIZE_1 = 48f   // 1 emoji
    const val EMOJI_ONLY_TEXT_SIZE_2 = 40f   // 2 emoji
    const val EMOJI_ONLY_TEXT_SIZE_3 = 34f   // 3 emoji

    // Poll
    const val POLL_QUESTION_TEXT_SIZE_SP = 15f
    const val POLL_OPTION_TEXT_SIZE_SP = 14f
    const val POLL_OPTION_ROW_HEIGHT_DP = 40f
    const val POLL_BAR_HEIGHT_DP = 28f
    const val POLL_BAR_CORNER_DP = 6f
    const val POLL_VOTES_TEXT_SIZE_SP = 12f
    const val POLL_SPACING_DP = 6f
    const val POLL_CHECKMARK_SIZE_DP = 18f

    // File
    const val FILE_ICON_SIZE_DP = 40f
    const val FILE_ROW_HEIGHT_DP = 52f
    const val FILE_NAME_TEXT_SIZE_SP = 14f
    const val FILE_SIZE_TEXT_SIZE_SP = 12f
    const val FILE_SPACING_DP = 8f
}

/** Конвертирует dp в пиксели. */
fun Context.dpToPx(dp: Float): Int =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, resources.displayMetrics).roundToInt()

/** Конвертирует sp в пиксели. */
fun Context.spToPx(sp: Float): Float =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, sp, resources.displayMetrics)

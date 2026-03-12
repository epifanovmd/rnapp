package com.rnapp.rncontextmenu

import android.graphics.RectF

object ContextMenuLayoutEngine {

    /** Рассчитывает позиции снапшота, панели эмодзи и панели действий на экране. */
    fun calculate(
        anchorRect: RectF,
        snapW: Float, snapH: Float,
        emojiW: Float, emojiH: Float,
        actionsW: Float, actionsH: Float,
        screenW: Float, screenH: Float,
        hPad: Float, vPad: Float,
        emojiGap: Float, actionsGap: Float,
        isMine: Boolean = false,
    ): ContextMenuLayout {
        val hasEmoji = emojiH > 0
        val hasActions = actionsH > 0
        val eGap = if (hasEmoji) emojiGap else 0f
        val mGap = if (hasActions) actionsGap else 0f

        val topLimit = vPad
        val bottomLimit = screenH - vPad

        val snapX = if (isMine)
            clamp(anchorRect.right - snapW, hPad, screenW - snapW - hPad)
        else
            clamp(anchorRect.left, hPad, screenW - snapW - hPad)

        val emojiX = if (hasEmoji) {
            if (isMine) clamp(snapX + snapW - emojiW, hPad, screenW - emojiW - hPad)
            else clamp(snapX, hPad, screenW - emojiW - hPad)
        } else 0f

        val menuX = if (hasActions) {
            if (isMine) clamp(snapX + snapW - actionsW, hPad, screenW - actionsW - hPad)
            else clamp(snapX, hPad, screenW - actionsW - hPad)
        } else 0f

        val totalH = emojiH + eGap + snapH + mGap + actionsH
        val needsScroll = totalH > bottomLimit - topLimit

        val emojiY: Float
        val snapY: Float
        val menuY: Float
        val canvasH: Float
        val scrollOffset: Float

        if (needsScroll) {
            emojiY = topLimit
            snapY = emojiY + emojiH + eGap
            menuY = snapY + snapH + mGap
            canvasH = menuY + actionsH + vPad
            scrollOffset = maxOf(0f, canvasH - screenH)
        } else {
            val blockTop = clamp(anchorRect.top - emojiH - eGap, topLimit, bottomLimit - totalH)
            emojiY = blockTop
            snapY = emojiY + emojiH + eGap
            menuY = snapY + snapH + mGap
            canvasH = screenH
            scrollOffset = 0f
        }

        val originY = anchorRect.top + scrollOffset

        return ContextMenuLayout(
            snapTarget = RectF(snapX, snapY, snapX + snapW, snapY + snapH),
            emojiTarget = if (hasEmoji) RectF(emojiX, emojiY, emojiX + emojiW, emojiY + emojiH) else RectF(),
            actionsTarget = if (hasActions) RectF(menuX, menuY, menuX + actionsW, menuY + actionsH) else RectF(),
            snapOrigin = RectF(anchorRect.left, originY, anchorRect.left + snapW, originY + snapH),
            emojiOrigin = if (hasEmoji) RectF(emojiX, originY - eGap - emojiH, emojiX + emojiW, originY - eGap) else RectF(),
            actionsOrigin = if (hasActions) RectF(menuX, originY + snapH + mGap, menuX + actionsW, originY + snapH + mGap + actionsH) else RectF(),
            hasEmoji = hasEmoji,
            hasActions = hasActions,
            canvasH = canvasH,
            needsScroll = needsScroll,
            scrollOffset = scrollOffset,
        )
    }

    private fun clamp(v: Float, lo: Float, hi: Float) = maxOf(lo, minOf(v, hi))
}

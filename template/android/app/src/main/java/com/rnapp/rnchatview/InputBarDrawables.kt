package com.rnapp.rnchatview

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.drawable.Drawable

// ─────────────────────────────────────────────────────────────────────────────
// InputBarDrawables.kt
//
// Зона ответственности: все кастомные Drawable-иконки инпут-бара.
// Каждая иконка рисуется на Canvas — без растровых ресурсов, масштабируется
// под любой размер кнопки. Цвет меняется снаружи через свойства, после чего
// нужно вызвать invalidateSelf() чтобы View перерисовала иконку.
//
// Классы internal, чтобы быть доступными внутри модуля, но не наружу.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Иконка стрелки «вверх» для кнопки отправки сообщения.
 *
 * Рисует вертикальную линию со стрелочными «крыльями» наверху.
 * Прозрачность чуть снижается когда [enabled] = false — визуально
 * подсказывает пользователю что поле пустое.
 */
internal class SendArrowDrawable : Drawable() {

    /**
     * Активное состояние кнопки.
     * false → иконка полупрозрачная (alpha 200), true → непрозрачная (alpha 255).
     * Не меняет кликабельность — это контролирует родительская View.
     */
    var enabled = false

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND   // скруглённые концы линий
        strokeJoin = Paint.Join.ROUND // скруглённые стыки
    }

    override fun draw(c: Canvas) {
        val w = bounds.width().toFloat()
        val h = bounds.height().toFloat()
        val cx = w / 2f
        val cy = h / 2f

        paint.strokeWidth = w * 0.12f
        paint.alpha = if (enabled) 255 else 200

        // Вертикальная ось стрелки: от нижней точки к верхней
        val top = cy - h * 0.22f
        val bot = cy + h * 0.22f
        val wing = w * 0.18f   // горизонтальный разлёт «крыльев»

        c.drawLine(cx, bot, cx, top, paint)           // ствол
        c.drawLine(cx, top, cx - wing, top + wing, paint) // левое крыло
        c.drawLine(cx, top, cx + wing, top + wing, paint) // правое крыло
    }

    override fun setAlpha(a: Int) { paint.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { paint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Иконка скрепки для кнопки прикрепления файла.
 *
 * Рисует два скруглённых прямоугольника один внутри другого —
 * классическая форма бумажной скрепки.
 * Цвет меняется через [iconColor] (реагирует на смену темы).
 */
internal class PaperclipDrawable : Drawable() {

    /**
     * Цвет иконки.
     * При смене темы RNChatView передаёт новое значение через applyTheme,
     * сеттер автоматически обновляет Paint и вызывает перерисовку.
     */
    var iconColor: Int = Color.rgb(120, 120, 128)
        set(v) { field = v; paint.color = v; invalidateSelf() }

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        color = Color.rgb(120, 120, 128)
    }

    override fun draw(c: Canvas) {
        val w = bounds.width().toFloat()
        val h = bounds.height().toFloat()
        paint.strokeWidth = w * 0.09f
        val cx = w * 0.5f

        // Внешний контур скрепки
        c.drawPath(Path().also {
            it.addRoundRect(
                cx - w * .15f, h * .15f,
                cx + w * .15f, h * .85f,
                w * .15f, w * .15f,
                Path.Direction.CW
            )
        }, paint)

        // Внутренний контур (вторая петля скрепки)
        c.drawPath(Path().also {
            it.addRoundRect(
                cx - w * .09f, h * .28f,
                cx + w * .09f, h * .76f,
                w * .09f, w * .09f,
                Path.Direction.CW
            )
        }, paint)
    }

    override fun setAlpha(a: Int) { paint.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { paint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Иконка «закрыть» — закрашенный круг с крестиком внутри.
 *
 * Используется в верхней панели (reply/edit) для кнопки отмены.
 * Цвет круга задаётся через [circleColor] — крестик всегда белый.
 */
internal class CloseCircleDrawable : Drawable() {

    /**
     * Цвет заливки круга.
     * Берётся из темы (theme.replyPanelClose) и может различаться
     * для светлой и тёмной темы.
     */
    var circleColor: Int = Color.rgb(180, 180, 185)
        set(v) { field = v; invalidateSelf() }

    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val crossPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }

    override fun draw(c: Canvas) {
        val cx = bounds.width() / 2f
        val cy = bounds.height() / 2f
        val r = minOf(cx, cy) - 1f    // небольшой отступ от краёв bounds
        val arm = r * 0.30f            // половина длины плеча крестика

        fillPaint.color = circleColor
        crossPaint.strokeWidth = r * 0.22f

        c.drawCircle(cx, cy, r, fillPaint)

        // Крестик из двух диагональных линий
        c.drawLine(cx - arm, cy - arm, cx + arm, cy + arm, crossPaint)
        c.drawLine(cx + arm, cy - arm, cx - arm, cy + arm, crossPaint)
    }

    override fun setAlpha(a: Int) {
        fillPaint.alpha = a
        crossPaint.alpha = a
        invalidateSelf()
    }

    override fun setColorFilter(cf: ColorFilter?) { fillPaint.colorFilter = cf }

    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

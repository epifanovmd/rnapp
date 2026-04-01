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
/**
 * Иконка микрофона для кнопки записи голосового сообщения.
 *
 * Рисует классический силуэт микрофона: скруглённый прямоугольник (капсула)
 * сверху и дуга-подставка снизу. Стиль совпадает с SendArrowDrawable.
 */
internal class MicDrawable : Drawable() {

    var iconColor: Int = Color.WHITE
        set(v) { field = v; paint.color = v; invalidateSelf() }

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }

    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.FILL
    }

    override fun draw(c: Canvas) {
        val w = bounds.width().toFloat()
        val h = bounds.height().toFloat()
        val cx = w / 2f
        val stroke = w * 0.10f
        paint.strokeWidth = stroke
        paint.color = iconColor
        fillPaint.color = iconColor

        // Capsule (mic head): rounded rect
        val capW = w * 0.24f
        val capTop = h * 0.18f
        val capBot = h * 0.52f
        val capR = capW // full rounding
        c.drawRoundRect(cx - capW, capTop, cx + capW, capBot, capR, capR, fillPaint)

        // Arc below capsule
        val arcLeft = cx - w * 0.28f
        val arcRight = cx + w * 0.28f
        val arcTop2 = h * 0.30f
        val arcBot2 = h * 0.68f
        c.drawArc(arcLeft, arcTop2, arcRight, arcBot2, 0f, 180f, false, paint)

        // Stem
        val stemTop = h * 0.68f
        val stemBot = h * 0.78f
        c.drawLine(cx, stemTop, cx, stemBot, paint)

        // Base
        val baseW = w * 0.16f
        c.drawLine(cx - baseW, stemBot, cx + baseW, stemBot, paint)
    }

    override fun setAlpha(a: Int) { paint.alpha = a; fillPaint.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { paint.colorFilter = cf; fillPaint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Иконка «play» — треугольник вправо.
 * Используется для кнопки воспроизведения голосового сообщения.
 */
internal class PlayTriangleDrawable : Drawable() {

    var iconColor: Int = Color.WHITE
        set(v) { field = v; paint.color = v; invalidateSelf() }

    var isPlaying: Boolean = false
        set(v) { field = v; invalidateSelf() }

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.FILL
    }

    private val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }

    override fun draw(c: Canvas) {
        val w = bounds.width().toFloat()
        val h = bounds.height().toFloat()
        val cx = w / 2f
        val cy = h / 2f
        paint.color = iconColor
        strokePaint.color = iconColor

        if (isPlaying) {
            // Pause icon: two vertical bars
            strokePaint.strokeWidth = w * 0.14f
            val barH = h * 0.36f
            val gap = w * 0.14f
            c.drawLine(cx - gap, cy - barH / 2, cx - gap, cy + barH / 2, strokePaint)
            c.drawLine(cx + gap, cy - barH / 2, cx + gap, cy + barH / 2, strokePaint)
        } else {
            // Play triangle
            val path = Path()
            val size = w * 0.32f
            val left = cx - size * 0.4f
            val right = cx + size * 0.6f
            val top = cy - size * 0.5f
            val bottom = cy + size * 0.5f
            path.moveTo(left, top)
            path.lineTo(right, cy)
            path.lineTo(left, bottom)
            path.close()
            c.drawPath(path, paint)
        }
    }

    override fun setAlpha(a: Int) { paint.alpha = a; invalidateSelf() }
    override fun setColorFilter(cf: ColorFilter?) { paint.colorFilter = cf }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

// ─────────────────────────────────────────────────────────────────────────────

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

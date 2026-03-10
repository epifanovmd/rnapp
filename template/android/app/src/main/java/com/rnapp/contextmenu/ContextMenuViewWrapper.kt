package com.rnapp.contextmenu

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import com.rnapp.chat.model.ChatAction
import com.rnapp.chat.theme.ContextMenuTheme

/**
 * ViewGroup-обёртка для RNContextMenuView.
 *
 * Роль в архитектуре:
 *  • Принимает единственный дочерний View из React Native (контент сообщения,
 *    кнопка, любой View) — управляется через addView/getChildAt/removeViewAt
 *    в ContextMenuViewManager.
 *  • Перехватывает long-press через onInterceptTouchEvent, запускает таймер.
 *  • При срабатывании таймера — создаёт снапшот контента, показывает
 *    ContextMenuOverlay через WindowManager поверх всего UI.
 *  • Пробрасывает события в JS через колбэки (wired в ViewManager).
 *
 * Соответствие NativeContextMenuViewSpec.ts:
 *  Props:  menuId, emojis, actions, theme, minimumPressDuration
 *  Events: onEmojiSelect, onActionSelect, onDismiss, onWillShow
 *
 * Пример использования из React Native:
 *  <ContextMenuView
 *    menuId={message.id}
 *    emojis={["❤️","👍","😂"]}
 *    actions={[{ id:"reply", title:"Reply", systemImage:"reply" }]}
 *    onActionSelect={({ actionId, menuId }) => handleAction(actionId, menuId)}
 *    onEmojiSelect={({ emoji, menuId }) => handleEmoji(emoji, menuId)}
 *  >
 *    <MessageBubble ... />
 *  </ContextMenuView>
 */
class ContextMenuViewWrapper(context: Context) : FrameLayout(context) {

    // ── Props (устанавливаются через @ReactProp в ViewManager) ────────────────

    var menuId: String              = ""
    var emojis: List<String>        = emptyList()
    var actions: List<ChatAction>   = emptyList()
    var menuTheme: ContextMenuTheme = ContextMenuTheme.light

    /**
     * Минимальное время удержания в миллисекундах.
     * Default = 350ms (0.35s) — соответствует WithDefault<Double, 0.35> в спеке.
     */
    var longPressDelayMs: Long = 350L

    // ── Event callbacks (wired в ContextMenuViewManager.wireEvents) ───────────

    var onEmojiSelect:  ((emoji: String,     menuId: String) -> Unit)? = null
    var onActionSelect: ((actionId: String,  menuId: String) -> Unit)? = null
    var onDismiss:      ((menuId: String) -> Unit)?                    = null
    var onWillShow:     ((menuId: String) -> Unit)?                    = null

    // ── Private state ─────────────────────────────────────────────────────────

    private var content: View?                 = null
    private var activeMenu: ContextMenuOverlay? = null
    private val handler                         = Handler(Looper.getMainLooper())
    private var longPressRunnable: Runnable?    = null
    private var touchStartX: Float             = 0f
    private var touchStartY: Float             = 0f

    // ── Child management ──────────────────────────────────────────────────────

    fun setContent(child: View) {
        content?.let { removeView(it) }
        content = child
        addView(child, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }

    fun getContent(): View? = content
    fun hasContent(): Boolean = content != null

    fun removeContent() {
        content?.let { removeView(it) }
        content = null
    }

    // ── Touch interception ────────────────────────────────────────────────────

    /**
     * Перехватываем touch для long-press детектора.
     * Возвращаем false — не потребляем touch, дочерний View получает все события.
     * Long-press таймер отменяется если палец сдвинулся больше TOUCH_SLOP.
     */
    override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
        when (ev.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                touchStartX = ev.x
                touchStartY = ev.y
                scheduleLongPress()
            }
            MotionEvent.ACTION_MOVE -> {
                val dx = ev.x - touchStartX
                val dy = ev.y - touchStartY
                if (dx * dx + dy * dy > TOUCH_SLOP * TOUCH_SLOP) {
                    cancelLongPressTimer()
                }
            }
            MotionEvent.ACTION_UP,
            MotionEvent.ACTION_CANCEL,
            MotionEvent.ACTION_POINTER_UP -> cancelLongPressTimer()
        }
        return false
    }

    private fun scheduleLongPress() {
        cancelLongPressTimer()
        val r = Runnable { openMenu() }
        longPressRunnable = r
        handler.postDelayed(r, longPressDelayMs)
    }

    private fun cancelLongPressTimer() {
        longPressRunnable?.let { handler.removeCallbacks(it) }
        longPressRunnable = null
    }

    // ── Menu presentation ─────────────────────────────────────────────────────

    private fun openMenu() {
        val activity = context.findActivity() ?: return

        // Anchor = контент View (сообщение), fallback = сам wrapper
        val anchor = content ?: this

        // Снапшот делаем ДО вызова onWillShow (и уж точно до alpha=0)
        val bitmap = captureBitmap(anchor)

        // Событие willShow — JS может обновить пропсы до показа
        onWillShow?.invoke(menuId)

        // Определяем гравитацию по горизонтальному положению anchor на экране
        val loc     = IntArray(2).also { anchor.getLocationOnScreen(it) }
        val screenW = context.resources.displayMetrics.widthPixels
        val gravity = if (loc[0] + anchor.width / 2 > screenW / 2)
            ContextMenuOverlay.AnchorGravity.END
        else
            ContextMenuOverlay.AnchorGravity.START

        // Закрываем предыдущее меню если осталось открытым
        activeMenu?.dismiss()

        activeMenu = ContextMenuOverlay.create(context, menuTheme).also { overlay ->
            overlay.show(
                activity      = activity,
                anchorView    = anchor,
                messageBitmap = bitmap,
                emojis        = emojis,
                actions       = actions,
                anchorGravity = gravity,
                listener      = object : ContextMenuOverlay.Listener {
                    override fun onEmojiSelected(emoji: String) {
                        onEmojiSelect?.invoke(emoji, menuId)
                        activeMenu = null
                    }
                    override fun onActionSelected(actionId: String) {
                        onActionSelect?.invoke(actionId, menuId)
                        activeMenu = null
                    }
                    override fun onDismiss() {
                        onDismiss?.invoke(menuId)
                        activeMenu = null
                    }
                }
            )
        }
    }

    // ── Cleanup ───────────────────────────────────────────────────────────────

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        cancelLongPressTimer()
        activeMenu?.dismiss()
        activeMenu = null
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun captureBitmap(view: View): Bitmap {
        val w = maxOf(1, view.width)
        val h = maxOf(1, view.height)
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        view.draw(Canvas(bmp))
        return bmp
    }

    private fun Context.findActivity(): Activity? {
        var ctx = this
        repeat(10) {
            if (ctx is Activity) return ctx as Activity
            ctx = (ctx as? ContextWrapper)?.baseContext ?: return null
        }
        return null
    }

    companion object {
        /** Порог сдвига пальца в пикселях для отмены long-press */
        private const val TOUCH_SLOP = 10f
    }
}

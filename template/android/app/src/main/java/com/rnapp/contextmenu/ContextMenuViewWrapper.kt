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
import android.view.ViewGroup
import android.widget.FrameLayout
import com.rnapp.chat.model.ChatAction
import com.rnapp.chat.theme.ContextMenuTheme

/**
 * ViewGroup-обёртка, добавляющая long-press для открытия контекстного меню.
 * Используется ContextMenuViewManager как контейнер для дочернего View из RN.
 */
class ContextMenuViewWrapper(context: Context) : FrameLayout(context) {

    // ── Configuration ─────────────────────────────────────────────────────
    var menuId: String               = ""
    var emojis: List<String>         = emptyList()
    var actions: List<ChatAction>    = emptyList()
    var menuTheme: ContextMenuTheme  = ContextMenuTheme.light
    var longPressDelayMs: Long       = 350L

    // ── Callbacks ─────────────────────────────────────────────────────────
    var onEmojiSelect: ((emoji: String, menuId: String) -> Unit)? = null
    var onActionSelect: ((actionId: String, menuId: String) -> Unit)? = null
    var onDismiss: ((menuId: String) -> Unit)? = null
    var onWillShow: ((menuId: String) -> Unit)? = null

    // ── Private ───────────────────────────────────────────────────────────
    private var content: View? = null
    private var activeMenu: ContextMenuOverlay? = null
    private val handler = Handler(Looper.getMainLooper())
    private var longPressRunnable: Runnable? = null

    // ── Children ──────────────────────────────────────────────────────────

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

    // ── Touch ─────────────────────────────────────────────────────────────

    override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
        when (ev.action) {
            MotionEvent.ACTION_DOWN -> {
                val r = Runnable { openMenu() }
                longPressRunnable = r
                handler.postDelayed(r, longPressDelayMs)
            }
            MotionEvent.ACTION_UP,
            MotionEvent.ACTION_CANCEL -> cancelLongPressInternal()
            MotionEvent.ACTION_MOVE   -> {
                if (ev.historySize > 0) {
                    val dx = ev.x - ev.getHistoricalX(0)
                    val dy = ev.y - ev.getHistoricalY(0)
                    if (dx * dx + dy * dy > TOUCH_SLOP * TOUCH_SLOP) cancelLongPressInternal()
                }
            }
        }
        return false
    }

    private fun cancelLongPressInternal() {
        longPressRunnable?.let { handler.removeCallbacks(it) }
        longPressRunnable = null
    }

    private fun openMenu() {
        val activity = context.findActivity() ?: return
        val anchor   = content ?: this

        onWillShow?.invoke(menuId)

        val bitmap = captureBitmap(anchor)
        val menuGravity = ContextMenuOverlay.AnchorGravity.START // default; override as needed

        activeMenu = ContextMenuOverlay.create(context, menuTheme).also { menu ->
            menu.show(
                activity      = activity,
                anchorView    = anchor,
                messageBitmap = bitmap,
                emojis        = emojis,
                actions       = actions,
                anchorGravity = menuGravity,
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

    private fun captureBitmap(view: View): Bitmap {
        val bmp = Bitmap.createBitmap(
            maxOf(1, view.width), maxOf(1, view.height), Bitmap.Config.ARGB_8888
        )
        val canvas = Canvas(bmp)
        view.draw(canvas)
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
        private const val TOUCH_SLOP = 10f
    }
}

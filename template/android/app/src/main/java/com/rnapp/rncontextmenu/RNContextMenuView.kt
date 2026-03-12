package com.rnapp.rncontextmenu

import android.os.Handler
import android.os.Looper
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import kotlin.math.abs

class RNContextMenuView(private val reactContext: ThemedReactContext) : FrameLayout(reactContext) {

    var menuId: String = ""
    var emojis: List<String> = emptyList()
    var actions: List<ContextMenuAction> = emptyList()
    var isDark: Boolean = false
    var minimumPressDuration: Long = 350L

    private var activeMenu: ContextMenuView? = null
    private val handler = Handler(Looper.getMainLooper())
    private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
    private var downX = 0f
    private var downY = 0f
    private var isWaitingForLongPress = false

    private val longPressRunnable = Runnable {
        if (isWaitingForLongPress) {
            isWaitingForLongPress = false
            performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
            showMenu()
        }
    }

    /** Переопределён намеренно пустым — RN позиционирует дочерние вью сам через Yoga. */
    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {}

    override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
        when (ev.action) {
            MotionEvent.ACTION_DOWN -> {
                downX = ev.x
                downY = ev.y
                isWaitingForLongPress = true
                handler.postDelayed(longPressRunnable, minimumPressDuration)
                return false
            }
            MotionEvent.ACTION_MOVE -> {
                if (isWaitingForLongPress) {
                    val dx = abs(ev.x - downX)
                    val dy = abs(ev.y - downY)
                    if (dx > touchSlop || dy > touchSlop) cancelLongPressTimer()
                }
                return false
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                cancelLongPressTimer()
                return false
            }
        }
        return false
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        cancelLongPressTimer()
        activeMenu?.dismiss()
        activeMenu = null
    }

    /** Программно скрывает активное меню. */
    fun dismissMenu() {
        activeMenu?.dismiss()
        activeMenu = null
    }

    private fun cancelLongPressTimer() {
        isWaitingForLongPress = false
        handler.removeCallbacks(longPressRunnable)
    }

    private fun showMenu() {
        if (emojis.isEmpty() && actions.isEmpty()) return
        sendEvent("onWillShow", args { putString("menuId", menuId) })
        activeMenu?.dismiss()
        activeMenu = ContextMenuView(
            ctx = context,
            emojis = emojis,
            actions = actions,
            isDark = isDark,
            isMine = false,
            onEmojiSelected = { emoji ->
                sendEvent("onEmojiSelect", args { putString("emoji", emoji); putString("menuId", menuId) })
            },
            onActionSelected = { action ->
                sendEvent("onActionSelect", args { putString("actionId", action.id); putString("menuId", menuId) })
            },
            onDismiss = {
                sendEvent("onDismiss", args { putString("menuId", menuId) })
                activeMenu = null
            },
        )
        activeMenu?.show(anchor = this, menuId = menuId)
    }

    private fun sendEvent(name: String, params: WritableMap) {
        val viewId = id.takeIf { it != NO_ID } ?: return
        try {
            val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, viewId) ?: return
            val surfaceId = UIManagerHelper.getSurfaceId(this)
            dispatcher.dispatchEvent(RNContextMenuViewEvent(surfaceId, viewId, name, params))
        } catch (_: Exception) {}
    }

    private fun args(block: WritableMap.() -> Unit): WritableMap =
        Arguments.createMap().also { it.block() }
}

private class RNContextMenuViewEvent(
    surfaceId: Int,
    viewId: Int,
    private val mEventName: String,
    private val mEventData: WritableMap,
) : Event<RNContextMenuViewEvent>(surfaceId, viewId) {
    override fun getEventName() = mEventName
    override fun getEventData() = mEventData
}

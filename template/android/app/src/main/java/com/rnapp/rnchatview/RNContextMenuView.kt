package com.rnapp.rnchatview

import android.content.Context
import android.view.HapticFeedbackConstants
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter

class RNContextMenuView(private val reactContext: ThemedReactContext) : FrameLayout(reactContext) {

    // ─── Props ────────────────────────────────────────────────────────────

    var menuId: String = ""
    var emojis: List<String> = emptyList()
    var actions: List<MessageAction> = emptyList()
    var isDark: Boolean = false
    var minimumPressDuration: Long = 350L   // ms

    // ─── State ────────────────────────────────────────────────────────────

    private var activeMenu: ContextMenuView? = null

    // ─── Long press setup ─────────────────────────────────────────────────

    init {
        isLongClickable = true
        setOnLongClickListener {
            performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
            showMenu()
            true
        }
    }

    // ─── Children handling ────────────────────────────────────────────────

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        // Важно: после того как React добавит детей, мы можем с ними работать
    }

    override fun addView(child: View) {
        // Просто добавляем ребенка в наш FrameLayout
        super.addView(child)
    }

    // ─── Show ─────────────────────────────────────────────────────────────

    private fun showMenu() {
        if (emojis.isEmpty() && actions.isEmpty()) return

        sendEvent("onWillShow", args { putString("menuId", menuId) })

        activeMenu?.dismiss()
        activeMenu = ContextMenuView(
            ctx              = context,
            emojis           = emojis,
            actions          = actions,
            isDark           = isDark,
            isMine           = false,   // standalone: no side bias, anchored to self
            onEmojiSelected  = { emoji ->
                sendEvent("onEmojiSelect", args {
                    putString("emoji", emoji)
                    putString("menuId", menuId)
                })
            },
            onActionSelected = { action ->
                sendEvent("onActionSelect", args {
                    putString("actionId", action.id)
                    putString("menuId", menuId)
                })
            },
            onDismiss = {
                sendEvent("onDismiss", args { putString("menuId", menuId) })
                activeMenu = null
            },
        )
        activeMenu?.show(anchor = this, messageId = menuId)
    }

    // ─── Event helper ─────────────────────────────────────────────────────

    private fun sendEvent(name: String, params: WritableMap) {
        val viewId = id
        if (viewId == View.NO_ID) return
        reactContext.getJSModule(RCTEventEmitter::class.java)
            ?.receiveEvent(viewId, name, params)
    }

    private fun args(block: WritableMap.() -> Unit): WritableMap =
        Arguments.createMap().also { it.block() }
}

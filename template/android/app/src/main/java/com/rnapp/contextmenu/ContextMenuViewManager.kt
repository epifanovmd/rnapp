package com.rnapp.contextmenu

import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.rnapp.contextmenu.ContextMenuViewWrapper
import com.rnapp.chat.model.ChatAction
import com.rnapp.chat.theme.ContextMenuTheme

class ContextMenuViewManager : ViewGroupManager<ContextMenuViewWrapper>() {

    override fun getName() = "RNContextMenuView"

    override fun createViewInstance(ctx: ThemedReactContext): ContextMenuViewWrapper =
        ContextMenuViewWrapper(ctx).also { wrapper ->
            wrapper.onEmojiSelect = { emoji, menuId ->
                emit(ctx, wrapper, Events.ON_EMOJI_SELECT, mapOf("emoji" to emoji, "menuId" to menuId))
            }
            wrapper.onActionSelect = { actionId, menuId ->
                emit(ctx, wrapper, Events.ON_ACTION_SELECT, mapOf("actionId" to actionId, "menuId" to menuId))
            }
            wrapper.onDismiss = { menuId ->
                emit(ctx, wrapper, Events.ON_DISMISS, mapOf("menuId" to menuId))
            }
            wrapper.onWillShow = { menuId ->
                emit(ctx, wrapper, Events.ON_WILL_SHOW, mapOf("menuId" to menuId))
            }
        }

    @ReactProp(name = "menuId")
    fun setMenuId(view: ContextMenuViewWrapper, menuId: String?) {
        view.menuId = menuId ?: ""
    }

    @ReactProp(name = "emojis")
    fun setEmojis(view: ContextMenuViewWrapper, emojis: ReadableArray?) {
        view.emojis = emojis?.toArrayList()?.mapNotNull { it as? String } ?: emptyList()
    }

    @ReactProp(name = "actions")
    fun setActions(view: ContextMenuViewWrapper, actions: ReadableArray?) {
        view.actions = actions?.toArrayList()?.mapNotNull { item ->
            (item as? Map<*, *>)?.let { m ->
                val id    = m["id"] as? String ?: return@let null
                val title = m["title"] as? String ?: return@let null
                ChatAction(
                    id            = id,
                    title         = title,
                    systemImage   = m["systemImage"] as? String,
                    isDestructive = m["isDestructive"] as? Boolean ?: false,
                )
            }
        } ?: emptyList()
    }

    @ReactProp(name = "theme")
    fun setTheme(view: ContextMenuViewWrapper, theme: String?) {
        view.menuTheme = if (theme == "dark") ContextMenuTheme.dark else ContextMenuTheme.light
    }

    @ReactProp(name = "minimumPressDuration", defaultFloat = 0.35f)
    fun setMinimumPressDuration(view: ContextMenuViewWrapper, duration: Float) {
        view.longPressDelayMs = (duration * 1000).toLong()
    }

    override fun addView(parent: ContextMenuViewWrapper, child: View, index: Int) {
        parent.setContent(child)
    }

    override fun getChildCount(parent: ContextMenuViewWrapper) =
        if (parent.hasContent()) 1 else 0

    override fun getChildAt(parent: ContextMenuViewWrapper, index: Int): View? =
        parent.getContent()

    override fun removeViewAt(parent: ContextMenuViewWrapper, index: Int) {
        parent.removeContent()
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
        Events.ALL.fold(MapBuilder.builder<String, Any>()) { acc, event ->
            acc.put(event, MapBuilder.of("registrationName", event))
        }.build()

    private fun emit(ctx: ThemedReactContext, view: View, event: String, data: Map<String, Any?>) {
        val map = com.facebook.react.bridge.Arguments.createMap()
        data.forEach { (k, v) ->
            when (v) {
                is String  -> map.putString(k, v)
                is Boolean -> map.putBoolean(k, v)
                else       -> map.putString(k, v?.toString() ?: "")
            }
        }
        ctx.getJSModule(RCTEventEmitter::class.java).receiveEvent(view.id, event, map)
    }

    object Events {
        const val ON_EMOJI_SELECT  = "onEmojiSelect"
        const val ON_ACTION_SELECT = "onActionSelect"
        const val ON_DISMISS       = "onDismiss"
        const val ON_WILL_SHOW     = "onWillShow"

        val ALL = listOf(ON_EMOJI_SELECT, ON_ACTION_SELECT, ON_DISMISS, ON_WILL_SHOW)
    }
}

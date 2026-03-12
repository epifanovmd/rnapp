package com.rnapp.rncontextmenu

import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

class RNContextMenuViewManager : ViewGroupManager<RNContextMenuView>() {

    companion object {
        const val REACT_CLASS = "RNContextMenuView"
    }

    override fun getName() = REACT_CLASS

    override fun createViewInstance(context: ThemedReactContext) = RNContextMenuView(context)

    @ReactProp(name = "menuId")
    fun setMenuId(view: RNContextMenuView, menuId: String?) {
        view.menuId = menuId ?: ""
    }

    @ReactProp(name = "emojis")
    fun setEmojis(view: RNContextMenuView, emojis: ReadableArray?) {
        view.emojis = emojis?.toEmojiList() ?: emptyList()
    }

    @ReactProp(name = "actions")
    fun setActions(view: RNContextMenuView, actions: ReadableArray?) {
        view.actions = actions?.toContextMenuActions() ?: emptyList()
    }

    @ReactProp(name = "theme")
    fun setTheme(view: RNContextMenuView, theme: String?) {
        view.isDark = theme?.lowercase() == "dark"
    }

    @ReactProp(name = "minimumPressDuration", defaultDouble = 0.35)
    fun setMinimumPressDuration(view: RNContextMenuView, seconds: Double) {
        view.minimumPressDuration = (seconds * 1000).toLong()
    }

    override fun addView(parent: RNContextMenuView, child: View, index: Int) {
        parent.addView(child, index)
    }

    override fun getChildCount(parent: RNContextMenuView) = parent.childCount

    override fun getChildAt(parent: RNContextMenuView, index: Int): View = parent.getChildAt(index)

    override fun removeViewAt(parent: RNContextMenuView, index: Int) {
        parent.removeViewAt(index)
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? =
        MapBuilder.builder<String, Any>()
            .put("onEmojiSelect", MapBuilder.of("registrationName", "onEmojiSelect"))
            .put("onActionSelect", MapBuilder.of("registrationName", "onActionSelect"))
            .put("onDismiss", MapBuilder.of("registrationName", "onDismiss"))
            .put("onWillShow", MapBuilder.of("registrationName", "onWillShow"))
            .build()
}

/** Парсит ReadableArray в список ContextMenuAction. */
private fun ReadableArray.toContextMenuActions(): List<ContextMenuAction> =
    (0 until size()).mapNotNull { getMap(it)?.let { m ->
        val id = m.getString("id")?.takeIf { it.isNotEmpty() } ?: return@mapNotNull null
        val title = m.getString("title")?.takeIf { it.isNotEmpty() } ?: return@mapNotNull null
        ContextMenuAction(
            id = id,
            title = title,
            systemImage = if (m.hasKey("systemImage") && !m.isNull("systemImage")) m.getString("systemImage") else null,
            isDestructive = if (m.hasKey("isDestructive")) m.getBoolean("isDestructive") else false,
        )
    }}

/** Парсит ReadableArray в список строк эмодзи. */
private fun ReadableArray.toEmojiList(): List<String> =
    (0 until size()).mapNotNull { getString(it)?.takeIf { s -> s.isNotEmpty() } }

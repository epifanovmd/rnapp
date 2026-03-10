package com.rnapp.rnchatview

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

    override fun createViewInstance(context: ThemedReactContext): RNContextMenuView =
        RNContextMenuView(context)

    // ─── Props ────────────────────────────────────────────────────────────

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
        view.actions = actions?.toMessageActions() ?: emptyList()
    }

    @ReactProp(name = "theme")
    fun setTheme(view: RNContextMenuView, theme: String?) {
        view.isDark = theme?.lowercase() == "dark"
    }

    @ReactProp(name = "minimumPressDuration", defaultDouble = 0.35)
    fun setMinimumPressDuration(view: RNContextMenuView, seconds: Double) {
        view.minimumPressDuration = (seconds * 1000).toLong()
    }

    // ─── Children handling ────────────────────────────────────────────────

    override fun addView(parent: RNContextMenuView, child: View, index: Int) {
        parent.addView(child, index)
    }

    override fun getChildCount(parent: RNContextMenuView): Int {
        return parent.childCount
    }

    override fun getChildAt(parent: RNContextMenuView, index: Int): View {
        return parent.getChildAt(index)
    }

    override fun removeViewAt(parent: RNContextMenuView, index: Int) {
        parent.removeViewAt(index)
    }

    // ─── Events ───────────────────────────────────────────────────────────

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? =
        MapBuilder.builder<String, Any>()
            .put("onEmojiSelect", MapBuilder.of("registrationName", "onEmojiSelect"))
            .put("onActionSelect", MapBuilder.of("registrationName", "onActionSelect"))
            .put("onDismiss", MapBuilder.of("registrationName", "onDismiss"))
            .put("onWillShow", MapBuilder.of("registrationName", "onWillShow"))
            .build()

    // Важно: указываем, что наш ViewGroup поддерживает детей
    override fun needsCustomLayoutForChildren(): Boolean {
        return false // используем стандартный layout
    }
}

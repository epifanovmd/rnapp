package com.rnapp.contextmenu

import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.Event
import com.rnapp.chat.model.ChatAction
import com.rnapp.chat.theme.ContextMenuTheme

/**
 * ViewManager для нативного компонента RNContextMenuView.
 *
 * Соответствует спецификации NativeContextMenuViewSpec.ts:
 *
 *   Props (все опциональные):
 *    - menuId: String
 *    - emojis: String[]
 *    - actions: { id, title, systemImage?, isDestructive? }[]
 *    - theme: "light" | "dark"
 *    - minimumPressDuration: Double (секунды)
 *
 *   Events (DirectEventHandler):
 *    - onEmojiSelect   → { emoji: string, menuId: string }
 *    - onActionSelect  → { actionId: string, menuId: string }
 *    - onDismiss       → { menuId: string }
 *    - onWillShow      → { menuId: string }
 *
 * Архитектура:
 *  ContextMenuViewWrapper (FrameLayout) — ViewGroup-контейнер:
 *    • Принимает дочерний View из RN (контент сообщения/любой View)
 *    • Перехватывает long-press через onInterceptTouchEvent
 *    • При срабатывании long-press → показывает ContextMenuOverlay
 *    • Overlay добавляется в WindowManager (поверх InputBar и всего UI)
 *
 * Совместимость с New Architecture:
 *  Используем UIManagerHelper.getEventDispatcherForReactTag() — единственный
 *  корректный способ отправки событий в Bridgeless / JSI режиме.
 *  Fallback через try/catch для Old Architecture.
 */
class ContextMenuViewManager : ViewGroupManager<ContextMenuViewWrapper>() {

    override fun getName() = "RNContextMenuView"

    override fun createViewInstance(ctx: ThemedReactContext): ContextMenuViewWrapper =
        ContextMenuViewWrapper(ctx).also { wrapper ->
            wireEvents(wrapper, ctx)
        }

    // ─── Event wiring ─────────────────────────────────────────────────────────

    private fun wireEvents(wrapper: ContextMenuViewWrapper, ctx: ThemedReactContext) {
        wrapper.onEmojiSelect = { emoji, menuId ->
            dispatchEvent(ctx, wrapper, Events.ON_EMOJI_SELECT) {
                putString("emoji",  emoji)
                putString("menuId", menuId)
            }
        }
        wrapper.onActionSelect = { actionId, menuId ->
            dispatchEvent(ctx, wrapper, Events.ON_ACTION_SELECT) {
                putString("actionId", actionId)
                putString("menuId",   menuId)
            }
        }
        wrapper.onDismiss = { menuId ->
            dispatchEvent(ctx, wrapper, Events.ON_DISMISS) {
                putString("menuId", menuId)
            }
        }
        wrapper.onWillShow = { menuId ->
            dispatchEvent(ctx, wrapper, Events.ON_WILL_SHOW) {
                putString("menuId", menuId)
            }
        }
    }

    // ─── Props ────────────────────────────────────────────────────────────────

    /** Уникальный ID меню — прокидывается во все события как menuId */
    @ReactProp(name = "menuId")
    fun setMenuId(view: ContextMenuViewWrapper, menuId: String?) {
        view.menuId = menuId ?: ""
    }

    /** Список эмодзи реакций: ["❤️", "👍", "😂"] */
    @ReactProp(name = "emojis")
    fun setEmojis(view: ContextMenuViewWrapper, emojis: ReadableArray?) {
        view.emojis = emojis?.toArrayList()
            ?.mapNotNull { it as? String }
            ?: emptyList()
    }

    /**
     * Список действий меню.
     * Формат каждого элемента: { id, title, systemImage?, isDestructive? }
     * Соответствует NativeContextMenuAction из спеки.
     */
    @ReactProp(name = "actions")
    fun setActions(view: ContextMenuViewWrapper, actions: ReadableArray?) {
        view.actions = actions?.toArrayList()
            ?.mapNotNull { item ->
                (item as? Map<*, *>)?.let { m ->
                    val id    = m["id"]    as? String ?: return@let null
                    val title = m["title"] as? String ?: return@let null
                    ChatAction(
                        id            = id,
                        title         = title,
                        systemImage   = m["systemImage"]   as? String,
                        isDestructive = m["isDestructive"] as? Boolean ?: false,
                    )
                }
            }
            ?: emptyList()
    }

    /** Тема оформления меню: "light" (default) или "dark" */
    @ReactProp(name = "theme")
    fun setTheme(view: ContextMenuViewWrapper, theme: String?) {
        view.menuTheme = if (theme == "dark") ContextMenuTheme.dark else ContextMenuTheme.light
    }

    /**
     * Минимальное время удержания для активации (секунды).
     * Default 0.35 — соответствует WithDefault<Double, 0.35> в спеке.
     */
    @ReactProp(name = "minimumPressDuration", defaultFloat = 0.35f)
    fun setMinimumPressDuration(view: ContextMenuViewWrapper, duration: Float) {
        view.longPressDelayMs = (duration * 1000f).toLong()
    }

    // ─── ViewGroup child management ───────────────────────────────────────────

    override fun addView(parent: ContextMenuViewWrapper, child: View, index: Int) {
        parent.setContent(child)
    }

    override fun getChildCount(parent: ContextMenuViewWrapper): Int =
        if (parent.hasContent()) 1 else 0

    override fun getChildAt(parent: ContextMenuViewWrapper, index: Int): View? =
        parent.getContent()

    override fun removeViewAt(parent: ContextMenuViewWrapper, index: Int) {
        parent.removeContent()
    }

    // ─── Event registration ───────────────────────────────────────────────────

    /**
     * Регистрируем DirectEventHandler'ы — соответствуют NativeContextMenuViewProps.
     * Имена регистрации совпадают с именами пропсов-колбэков в JS.
     */
    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
        Events.ALL.fold(MapBuilder.builder<String, Any>()) { builder, eventName ->
            builder.put(eventName, MapBuilder.of("registrationName", eventName))
        }.build()

    // ─── Event dispatch (New Architecture compatible) ─────────────────────────

    /**
     * Отправка событий через UIManagerHelper — совместимо с New Architecture.
     *
     * Используем DSL-лямбду для удобного построения WritableMap:
     *   dispatchEvent(ctx, view, "onEmojiSelect") {
     *       putString("emoji", "❤️")
     *       putString("menuId", "msg_1")
     *   }
     */
    private fun dispatchEvent(
        ctx: ThemedReactContext,
        view: View,
        eventName: String,
        buildPayload: com.facebook.react.bridge.WritableMap.() -> Unit,
    ) {
        try {
            val surfaceId  = UIManagerHelper.getSurfaceId(view)
            val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(ctx, view.id)
            val payload    = com.facebook.react.bridge.Arguments.createMap().apply(buildPayload)
            dispatcher?.dispatchEvent(ContextMenuEvent(surfaceId, view.id, eventName, payload))
        } catch (e: Exception) {
            android.util.Log.w("ContextMenuViewManager", "Failed to dispatch $eventName: ${e.message}")
        }
    }

    // ─── Event ────────────────────────────────────────────────────────────────

    /**
     * Кастомный Event для New Architecture.
     * canCoalesce = false — события не схлопываются, каждое доставляется в JS.
     */
    private class ContextMenuEvent(
        surfaceId: Int,
        viewId: Int,
        private val myEventName: String,
        private val payload: com.facebook.react.bridge.WritableMap,
    ) : Event<ContextMenuEvent>(surfaceId, viewId) {

        override fun getEventName(): String = myEventName
        override fun canCoalesce(): Boolean = false
        override fun getEventData(): com.facebook.react.bridge.WritableMap = payload
    }

    // ─── Event name constants ─────────────────────────────────────────────────

    /**
     * Имена событий строго соответствуют NativeContextMenuViewProps:
     *   onEmojiSelect, onActionSelect, onDismiss, onWillShow
     */
    object Events {
        const val ON_EMOJI_SELECT  = "onEmojiSelect"
        const val ON_ACTION_SELECT = "onActionSelect"
        const val ON_DISMISS       = "onDismiss"
        const val ON_WILL_SHOW     = "onWillShow"

        val ALL = listOf(ON_EMOJI_SELECT, ON_ACTION_SELECT, ON_DISMISS, ON_WILL_SHOW)
    }
}

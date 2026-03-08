package com.rnapp.chat.module

import android.graphics.Color
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.rnapp.chat.ChatView
import com.rnapp.chat.model.*

/**
 * React Native ViewManager для ChatView.
 * Регистрирует все props и events из NativeChatViewSpec.ts.
 *
 * Регистрация в ReactPackage:
 *   override fun createViewManagers(context: ReactApplicationContext) =
 *       listOf(ChatViewManager(), ContextMenuViewManager())
 */
class ChatViewManager : SimpleViewManager<ChatView>() {

    override fun getName() = "RNChatView"

    override fun createViewInstance(ctx: ThemedReactContext): ChatView =
        ChatView(ctx).also { view ->
            view.onScroll = { x, y ->
                emit(ctx, view, Events.ON_SCROLL, mapOf("x" to x, "y" to y))
            }
            view.onReachTop = { dist ->
                emit(ctx, view, Events.ON_REACH_TOP, mapOf("distanceFromTop" to dist))
            }
            view.onMessagesVisible = { ids ->
                emit(ctx, view, Events.ON_MESSAGES_VISIBLE, mapOf("messageIds" to ids))
            }
            view.onMessagePress = { id ->
                emit(ctx, view, Events.ON_MESSAGE_PRESS, mapOf("messageId" to id))
            }
            view.onActionPress = { actionId, messageId ->
                emit(ctx, view, Events.ON_ACTION_PRESS, mapOf("actionId" to actionId, "messageId" to messageId))
            }
            view.onEmojiReactionSelect = { emoji, messageId ->
                emit(ctx, view, Events.ON_EMOJI_REACTION_SELECT, mapOf("emoji" to emoji, "messageId" to messageId))
            }
            view.onSendMessage = { text, replyToId ->
                val map = mutableMapOf<String, Any?>("text" to text)
                replyToId?.let { map["replyToId"] = it }
                emit(ctx, view, Events.ON_SEND_MESSAGE, map)
            }
            view.onEditMessage = { text, messageId ->
                emit(ctx, view, Events.ON_EDIT_MESSAGE, mapOf("text" to text, "messageId" to messageId))
            }
            view.onCancelInputAction = { type ->
                emit(ctx, view, Events.ON_CANCEL_INPUT_ACTION, mapOf("type" to type))
            }
            view.onAttachmentPress = {
                emit(ctx, view, Events.ON_ATTACHMENT_PRESS, emptyMap<String, Any>())
            }
            view.onReplyMessagePress = { id ->
                emit(ctx, view, Events.ON_REPLY_MESSAGE_PRESS, mapOf("messageId" to id))
            }
        }

    // ── Props ─────────────────────────────────────────────────────────────

    @ReactProp(name = "messages")
    fun setMessages(view: ChatView, messages: ReadableArray?) {
        val list = messages?.toArrayList()?.mapNotNull { item ->
            (item as? Map<*, *>)?.toChatMessage()
        } ?: emptyList()
        view.setMessages(list)
    }

    @ReactProp(name = "actions")
    fun setActions(view: ChatView, actions: ReadableArray?) {
        view.actions = actions?.toArrayList()?.mapNotNull { item ->
            (item as? Map<*, *>)?.toChatAction()
        } ?: emptyList()
    }

    @ReactProp(name = "emojiReactions")
    fun setEmojiReactions(view: ChatView, emojis: ReadableArray?) {
        view.emojiReactions = emojis?.toArrayList()?.mapNotNull { it as? String } ?: emptyList()
    }

    @ReactProp(name = "theme")
    fun setTheme(view: ChatView, theme: String?) {
        view.setTheme(theme ?: "light")
    }

    @ReactProp(name = "isLoading", defaultBoolean = false)
    fun setIsLoading(view: ChatView, loading: Boolean) {
        view.isLoading = loading
    }

    @ReactProp(name = "scrollToBottomThreshold", defaultFloat = 150f)
    fun setScrollToBottomThreshold(view: ChatView, threshold: Float) {
        view.scrollToBottomThreshold = threshold.toInt()
    }

    @ReactProp(name = "topThreshold", defaultFloat = 200f)
    fun setTopThreshold(view: ChatView, threshold: Float) {
        view.topThreshold = threshold.toInt()
    }

    @ReactProp(name = "collectionInsetTop", defaultFloat = 0f)
    fun setCollectionInsetTop(view: ChatView, inset: Float) {
        view.collectionInsetTop = inset.toInt()
    }

    @ReactProp(name = "collectionInsetBottom", defaultFloat = 0f)
    fun setCollectionInsetBottom(view: ChatView, inset: Float) {
        view.collectionInsetBottom = inset.toInt()
    }

    @ReactProp(name = "inputAction")
    fun setInputAction(view: ChatView, action: ReadableMap?) {
        view.setInputAction(
            action?.let {
                ChatInputAction(
                    type      = it.getString("type") ?: "none",
                    messageId = if (it.hasKey("messageId")) it.getString("messageId") else null,
                )
            }
        )
    }

    @ReactProp(name = "initialScrollId")
    fun setInitialScrollId(view: ChatView, id: String?) {
        if (id != null) view.scrollToMessage(id, animated = false, highlight = false)
    }

    // ── Commands ──────────────────────────────────────────────────────────

    override fun getCommandsMap(): Map<String, Int> = mapOf(
        CMD_SCROLL_TO_BOTTOM  to CMD_SCROLL_TO_BOTTOM_ID,
        CMD_SCROLL_TO_MESSAGE to CMD_SCROLL_TO_MESSAGE_ID,
    )

    override fun receiveCommand(view: ChatView, commandId: String, args: ReadableArray?) {
        when (commandId) {
            CMD_SCROLL_TO_BOTTOM  -> view.scrollToBottom(animated = true)
            CMD_SCROLL_TO_MESSAGE -> {
                val messageId = args?.getString(0) ?: return
                val position  = args.getString(1) ?: "center"
                val animated  = args.getBoolean(2)
                val highlight = args.getBoolean(3)
                view.scrollToMessage(messageId, position, animated, highlight)
            }
        }
    }

    // ── Events ────────────────────────────────────────────────────────────

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
        Events.ALL.fold(MapBuilder.builder<String, Any>()) { acc, event ->
            acc.put(event, MapBuilder.of("registrationName", event))
        }.build()

    // ── Helpers ───────────────────────────────────────────────────────────

    private fun emit(ctx: ThemedReactContext, view: ChatView, event: String, data: Map<String, Any?>) {
        ctx.getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(view.id, event, data.toWritableMap())
    }

    private fun Map<String, Any?>.toWritableMap(): com.facebook.react.bridge.WritableMap {
        val map = com.facebook.react.bridge.Arguments.createMap()
        forEach { (k, v) ->
            when (v) {
                is String  -> map.putString(k, v)
                is Boolean -> map.putBoolean(k, v)
                is Int     -> map.putInt(k, v)
                is Double  -> map.putDouble(k, v)
                is Float   -> map.putDouble(k, v.toDouble())
                is List<*> -> map.putArray(k, com.facebook.react.bridge.Arguments.fromList(v))
                null       -> map.putNull(k)
                else       -> map.putString(k, v.toString())
            }
        }
        return map
    }

    private fun Map<*, *>.toChatMessage(): ChatMessage? {
        val id        = get("id") as? String ?: return null
        val timestamp = (get("timestamp") as? Number)?.toDouble() ?: return null
        return ChatMessage(
            id         = id,
            text       = get("text") as? String,
            images     = (get("images") as? List<*>)?.mapNotNull { it as? Map<*, *> }?.map { img ->
                ChatImageItem(
                    url          = img["url"] as? String ?: "",
                    width        = (img["width"] as? Number)?.toDouble(),
                    height       = (img["height"] as? Number)?.toDouble(),
                    thumbnailUrl = img["thumbnailUrl"] as? String,
                )
            },
            timestamp  = timestamp,
            senderName = get("senderName") as? String,
            isMine     = get("isMine") as? Boolean ?: false,
            status     = get("status") as? String,
            replyTo    = (get("replyTo") as? Map<*, *>)?.let { r ->
                ChatReplyRef(
                    id         = r["id"] as? String ?: "",
                    text       = r["text"] as? String,
                    senderName = r["senderName"] as? String,
                    hasImages  = r["hasImages"] as? Boolean,
                )
            },
            isEdited = get("isEdited") as? Boolean ?: false,
        )
    }

    private fun Map<*, *>.toChatAction(): ChatAction? {
        val id    = get("id") as? String ?: return null
        val title = get("title") as? String ?: return null
        return ChatAction(
            id             = id,
            title          = title,
            systemImage    = get("systemImage") as? String,
            isDestructive  = get("isDestructive") as? Boolean ?: false,
        )
    }

    companion object {
        private const val CMD_SCROLL_TO_BOTTOM    = "scrollToBottom"
        private const val CMD_SCROLL_TO_MESSAGE   = "scrollToMessage"
        private const val CMD_SCROLL_TO_BOTTOM_ID = 1
        private const val CMD_SCROLL_TO_MESSAGE_ID = 2
    }

    // ── Event names (зеркало DirectEventHandler из NativeChatViewSpec) ─────
    object Events {
        const val ON_SCROLL                = "onScroll"
        const val ON_REACH_TOP             = "onReachTop"
        const val ON_MESSAGES_VISIBLE      = "onMessagesVisible"
        const val ON_MESSAGE_PRESS         = "onMessagePress"
        const val ON_ACTION_PRESS          = "onActionPress"
        const val ON_EMOJI_REACTION_SELECT = "onEmojiReactionSelect"
        const val ON_SEND_MESSAGE          = "onSendMessage"
        const val ON_EDIT_MESSAGE          = "onEditMessage"
        const val ON_CANCEL_INPUT_ACTION   = "onCancelInputAction"
        const val ON_ATTACHMENT_PRESS      = "onAttachmentPress"
        const val ON_REPLY_MESSAGE_PRESS   = "onReplyMessagePress"

        val ALL = listOf(
            ON_SCROLL, ON_REACH_TOP, ON_MESSAGES_VISIBLE, ON_MESSAGE_PRESS,
            ON_ACTION_PRESS, ON_EMOJI_REACTION_SELECT, ON_SEND_MESSAGE,
            ON_EDIT_MESSAGE, ON_CANCEL_INPUT_ACTION, ON_ATTACHMENT_PRESS,
            ON_REPLY_MESSAGE_PRESS,
        )
    }
}

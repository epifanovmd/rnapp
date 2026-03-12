package com.rnapp.rnchatview

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class RNChatViewManager : SimpleViewManager<RNChatView>() {

    companion object {
        const val REACT_CLASS = "RNChatView"
        const val CMD_SCROLL_TO_BOTTOM = 1
        const val CMD_SCROLL_TO_MESSAGE = 2
    }

    private val insetTopCache = HashMap<Int, Int>()
    private val insetBottomCache = HashMap<Int, Int>()

    override fun getName() = REACT_CLASS

    override fun createViewInstance(context: ThemedReactContext) = RNChatView(context)

    @ReactProp(name = "messages")
    fun setMessages(view: RNChatView, messages: ReadableArray?) {
        view.setMessages(messages?.toChatMessages() ?: emptyList())
    }

    @ReactProp(name = "actions")
    fun setActions(view: RNChatView, actions: ReadableArray?) {
        view.setActions(actions?.toMessageActions() ?: emptyList())
    }

    @ReactProp(name = "emojiReactions")
    fun setEmojiReactions(view: RNChatView, emojis: ReadableArray?) {
        view.setEmojiReactions(emojis?.toEmojiList() ?: emptyList())
    }

    @ReactProp(name = "theme")
    fun setTheme(view: RNChatView, theme: String?) {
        view.setTheme(theme ?: "light")
    }

    @ReactProp(name = "isLoading", defaultBoolean = false)
    fun setIsLoading(view: RNChatView, loading: Boolean) {
        view.setIsLoading(loading)
    }

    @ReactProp(name = "topThreshold", defaultDouble = 200.0)
    fun setTopThreshold(view: RNChatView, value: Double) {
        view.setTopThreshold(value.toInt())
    }

    @ReactProp(name = "scrollToBottomThreshold", defaultDouble = 150.0)
    fun setScrollToBottomThreshold(view: RNChatView, value: Double) {
        view.setScrollToBottomThreshold(value.toInt())
    }

    @ReactProp(name = "initialScrollId")
    fun setInitialScrollId(view: RNChatView, messageId: String?) {
        view.setInitialScrollId(messageId)
    }

    @ReactProp(name = "collectionInsetTop", defaultDouble = 0.0)
    fun setCollectionInsetTop(view: RNChatView, inset: Double) {
        val id = System.identityHashCode(view)
        insetTopCache[id] = inset.toInt()
        view.setCollectionInsets(inset.toInt(), insetBottomCache[id] ?: 0)
    }

    @ReactProp(name = "collectionInsetBottom", defaultDouble = 0.0)
    fun setCollectionInsetBottom(view: RNChatView, inset: Double) {
        val id = System.identityHashCode(view)
        insetBottomCache[id] = inset.toInt()
        view.setCollectionInsets(insetTopCache[id] ?: 0, inset.toInt())
    }

    @ReactProp(name = "inputAction")
    fun setInputAction(view: RNChatView, action: ReadableMap?) {
        view.setInputAction(action?.toChatInputAction() ?: ChatInputAction.None)
    }

    override fun getCommandsMap(): Map<String, Int> = mapOf(
        "scrollToBottom" to CMD_SCROLL_TO_BOTTOM,
        "scrollToMessage" to CMD_SCROLL_TO_MESSAGE,
    )

    override fun receiveCommand(view: RNChatView, commandId: String, args: ReadableArray?) {
        when (commandId) {
            "scrollToBottom" -> view.scrollToBottom()
            "scrollToMessage" -> handleScrollToMessage(view, args)
        }
    }

    override fun receiveCommand(view: RNChatView, commandId: Int, args: ReadableArray?) {
        when (commandId) {
            CMD_SCROLL_TO_BOTTOM -> view.scrollToBottom()
            CMD_SCROLL_TO_MESSAGE -> handleScrollToMessage(view, args)
        }
    }

    private fun handleScrollToMessage(view: RNChatView, args: ReadableArray?) {
        val messageId = args?.getString(0) ?: return
        val posStr = args.getString(1) ?: "center"
        val animated = if (args.size() > 2) args.getBoolean(2) else true
        val highlight = if (args.size() > 3) args.getBoolean(3) else true
        val position = when (posStr.lowercase()) {
            "top" -> ChatScrollPosition.TOP
            "bottom" -> ChatScrollPosition.BOTTOM
            else -> ChatScrollPosition.CENTER
        }
        view.scrollToMessage(messageId, position, animated, highlight)
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> = mapOf(
        "onScroll" to event("onScroll"),
        "onReachTop" to event("onReachTop"),
        "onMessagesVisible" to event("onMessagesVisible"),
        "onMessagePress" to event("onMessagePress"),
        "onActionPress" to event("onActionPress"),
        "onEmojiReactionSelect" to event("onEmojiReactionSelect"),
        "onSendMessage" to event("onSendMessage"),
        "onEditMessage" to event("onEditMessage"),
        "onCancelInputAction" to event("onCancelInputAction"),
        "onAttachmentPress" to event("onAttachmentPress"),
        "onReplyMessagePress" to event("onReplyMessagePress"),
    )

    private fun event(name: String) = mapOf("registrationName" to name)
}

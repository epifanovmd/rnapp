package com.rnapp.rnwheelpicker

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.Event

/** Событие колеса: имя приходит из [getExportedCustomDirectEventTypeConstants]. */
private class WheelEvent(
    surfaceId: Int,
    viewTag: Int,
    private val name: String,
    private val payload: WritableMap,
) : Event<WheelEvent>(surfaceId, viewTag) {

    override fun getEventName() = name

    override fun getEventData() = payload

    override fun canCoalesce() = name == RNWheelPickerManager.EVENT_SCROLL
}

class RNWheelPickerManager : SimpleViewManager<RNWheelPickerView>() {

    companion object {
        const val REACT_CLASS = "RNWheelPicker"

        // Имена событий совпадают с view-config из codegen: `onX` → `topX`.
        const val EVENT_CHANGE = "topValueChange"
        const val EVENT_SCROLL_STATE = "topScrollStateChange"
        const val EVENT_SCROLL = "topScroll"
        const val EVENT_ITEM_PRESS = "topItemPress"
    }

    override fun getName() = REACT_CLASS

    override fun createViewInstance(context: ThemedReactContext): RNWheelPickerView {
        val view = RNWheelPickerView(context)

        view.onSelectionChange = { index, value, fromUser ->
            val payload = Arguments.createMap().apply {
                putInt("index", index)
                putString("value", value)
                putBoolean("fromUser", fromUser)
            }

            dispatch(view, EVENT_CHANGE, payload)
        }

        view.onScrollStateChange = { state, index, value ->
            val payload = Arguments.createMap().apply {
                putInt("state", state)
                putInt("index", index)
                putString("value", value)
            }

            dispatch(view, EVENT_SCROLL_STATE, payload)
        }

        view.onItemPress = { index, value ->
            val payload = Arguments.createMap().apply {
                putInt("index", index)
                putString("value", value)
            }

            dispatch(view, EVENT_ITEM_PRESS, payload)
        }

        view.onScrollOffset = { offset, index ->
            val payload = Arguments.createMap().apply {
                putDouble("offset", offset)
                putInt("index", index)
            }

            dispatch(view, EVENT_SCROLL, payload)
        }

        return view
    }

    private fun dispatch(view: RNWheelPickerView, name: String, payload: WritableMap) {
        val context = view.context as ThemedReactContext
        val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, view.id) ?: return

        dispatcher.dispatchEvent(
            WheelEvent(UIManagerHelper.getSurfaceId(view), view.id, name, payload),
        )
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
        mutableMapOf(
            EVENT_CHANGE to mapOf("registrationName" to "onValueChange"),
            EVENT_SCROLL_STATE to mapOf("registrationName" to "onScrollStateChange"),
            EVENT_SCROLL to mapOf("registrationName" to "onScroll"),
            EVENT_ITEM_PRESS to mapOf("registrationName" to "onItemPress"),
        )

    override fun onAfterUpdateTransaction(view: RNWheelPickerView) {
        super.onAfterUpdateTransaction(view)
        view.applyProps()
    }

    override fun receiveCommand(view: RNWheelPickerView, commandId: String?, args: ReadableArray?) {
        if (commandId == "scrollToIndex" && args != null && args.size() >= 2) {
            view.scrollToIndex(args.getInt(0), args.getBoolean(1))
        }
    }

    // ─── Данные и поведение ──────────────────────────────────────────────────

    @ReactProp(name = "items")
    fun setItems(view: RNWheelPickerView, items: ReadableArray?) {
        val parsed = mutableListOf<WheelItem>()

        for (i in 0 until (items?.size() ?: 0)) {
            val raw: ReadableMap = items?.getMap(i) ?: continue
            val label = if (raw.hasKey("label")) raw.getString("label").orEmpty() else ""
            val value = if (raw.hasKey("value")) raw.getString("value").orEmpty() else label
            val disabled = raw.hasKey("disabled") && raw.getBoolean("disabled")
            val color = if (raw.hasKey("color") && !raw.isNull("color")) raw.getInt("color") else null

            parsed.add(WheelItem(label, value, disabled, color))
        }

        view.setItems(parsed)
    }

    @ReactProp(name = "selectedIndex", defaultInt = 0)
    fun setSelectedIndex(view: RNWheelPickerView, index: Int) = view.setSelectedIndex(index)

    @ReactProp(name = "loop", defaultBoolean = false)
    fun setLoop(view: RNWheelPickerView, value: Boolean) {
        view.loop = value
    }

    @ReactProp(name = "enabled", defaultBoolean = true)
    fun setEnabled(view: RNWheelPickerView, value: Boolean) {
        view.wheelEnabled = value
    }

    @ReactProp(name = "stopAtDisabled", defaultBoolean = true)
    fun setStopAtDisabled(view: RNWheelPickerView, value: Boolean) {
        view.stopAtDisabled = value
    }

    @ReactProp(name = "haptics", defaultBoolean = true)
    fun setHaptics(view: RNWheelPickerView, value: Boolean) {
        view.haptics = value
    }

    @ReactProp(name = "scrollEventThrottle", defaultInt = 0)
    fun setScrollEventThrottle(view: RNWheelPickerView, value: Int) {
        view.scrollEventThrottle = value
    }

    // ─── Геометрия ───────────────────────────────────────────────────────────

    @ReactProp(name = "itemHeight", defaultDouble = 44.0)
    fun setItemHeight(view: RNWheelPickerView, value: Double) {
        view.itemHeightDp = value
    }

    @ReactProp(name = "visibleItemCount", defaultInt = 5)
    fun setVisibleItemCount(view: RNWheelPickerView, value: Int) {
        view.visibleItemCount = value
    }

    @ReactProp(name = "itemSpacing", defaultDouble = 0.0)
    fun setItemSpacing(view: RNWheelPickerView, value: Double) {
        view.itemSpacingDp = value
    }

    // ─── Текст ───────────────────────────────────────────────────────────────

    @ReactProp(name = "itemColor", customType = "Color")
    fun setItemColor(view: RNWheelPickerView, color: Int?) {
        view.itemColor = color ?: android.graphics.Color.BLACK
    }

    @ReactProp(name = "selectedItemColor", customType = "Color")
    fun setSelectedItemColor(view: RNWheelPickerView, color: Int?) {
        view.selectedItemColor = color
    }

    @ReactProp(name = "disabledItemColor", customType = "Color")
    fun setDisabledItemColor(view: RNWheelPickerView, color: Int?) {
        view.disabledItemColor = color ?: android.graphics.Color.LTGRAY
    }

    @ReactProp(name = "fontSize", defaultDouble = 20.0)
    fun setFontSize(view: RNWheelPickerView, value: Double) {
        view.fontSize = value
    }

    @ReactProp(name = "selectedFontSize", defaultDouble = 20.0)
    fun setSelectedFontSize(view: RNWheelPickerView, value: Double) {
        view.selectedFontSize = value
    }

    @ReactProp(name = "fontFamily")
    fun setFontFamily(view: RNWheelPickerView, value: String?) {
        view.fontFamily = value
    }

    @ReactProp(name = "fontWeight")
    fun setFontWeight(view: RNWheelPickerView, value: String?) {
        view.fontWeight = value ?: "normal"
    }

    @ReactProp(name = "selectedFontWeight")
    fun setSelectedFontWeight(view: RNWheelPickerView, value: String?) {
        view.selectedFontWeight = value ?: "normal"
    }

    @ReactProp(name = "textAlign")
    fun setTextAlign(view: RNWheelPickerView, value: String?) {
        view.textAlign = value ?: "center"
    }

    @ReactProp(name = "numberOfLines", defaultInt = 1)
    fun setNumberOfLines(view: RNWheelPickerView, value: Int) {
        view.textLines = value.coerceAtLeast(1)
    }

    @ReactProp(name = "itemPaddingHorizontal", defaultDouble = 8.0)
    fun setItemPaddingHorizontal(view: RNWheelPickerView, value: Double) {
        view.itemPaddingHorizontal = value
    }

    // ─── Объём ───────────────────────────────────────────────────────────────

    @ReactProp(name = "curvature", defaultDouble = 1.0)
    fun setCurvature(view: RNWheelPickerView, value: Double) {
        view.curvature = value
    }

    @ReactProp(name = "edgeOpacity", defaultDouble = 0.25)
    fun setEdgeOpacity(view: RNWheelPickerView, value: Double) {
        view.edgeOpacity = value
    }

    @ReactProp(name = "edgeScale", defaultDouble = 0.8)
    fun setEdgeScale(view: RNWheelPickerView, value: Double) {
        view.edgeScale = value
    }

    // ─── Индикатор и шторка ──────────────────────────────────────────────────

    @ReactProp(name = "indicatorVisible", defaultBoolean = true)
    fun setIndicatorVisible(view: RNWheelPickerView, value: Boolean) {
        view.indicatorVisible = value
    }

    @ReactProp(name = "indicatorColor", customType = "Color")
    fun setIndicatorColor(view: RNWheelPickerView, color: Int?) {
        view.indicatorColor = color ?: android.graphics.Color.LTGRAY
    }

    @ReactProp(name = "indicatorSize", defaultDouble = 1.0)
    fun setIndicatorSize(view: RNWheelPickerView, value: Double) {
        view.indicatorSizeDp = value
    }

    @ReactProp(name = "indicatorStyle")
    fun setIndicatorStyle(view: RNWheelPickerView, value: String?) {
        view.indicatorStyle = value ?: "fill"
    }

    @ReactProp(name = "indicatorRadius", defaultDouble = 0.0)
    fun setIndicatorRadius(view: RNWheelPickerView, value: Double) {
        view.indicatorRadiusDp = value
    }

    @ReactProp(name = "indicatorInset", defaultDouble = 0.0)
    fun setIndicatorInset(view: RNWheelPickerView, value: Double) {
        view.indicatorInsetDp = value
    }

    @ReactProp(name = "curtainVisible", defaultBoolean = false)
    fun setCurtainVisible(view: RNWheelPickerView, value: Boolean) {
        view.curtainVisible = value
    }

    @ReactProp(name = "curtainColor", customType = "Color")
    fun setCurtainColor(view: RNWheelPickerView, color: Int?) {
        view.curtainColor = color ?: android.graphics.Color.TRANSPARENT
    }

    @ReactProp(name = "curtainRadius", defaultDouble = 0.0)
    fun setCurtainRadius(view: RNWheelPickerView, value: Double) {
        view.curtainRadiusDp = value
    }
}

package com.rnapp.rnwheelpicker.events;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

public class ItemSelectedEvent extends Event<ItemSelectedEvent> {

  public static final String EVENT_NAME = "pickerItemSelected";

  private final Object mValue;
  private final int mColumn;
  private final int mIndex;

  public ItemSelectedEvent(int viewTag, Object value, int index, int column) {
    super(viewTag);
    mValue = value;
    mIndex = index;
    mColumn = column;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  // Fabric-совместимый метод для создания данных события
  public static WritableMap createEventData(Object value, int index, int column) {
    WritableMap eventData = Arguments.createMap();

    Class valueClass = value.getClass();
    if (valueClass == Integer.class) {
      eventData.putInt("value", (Integer) value);
    } else if (valueClass == Double.class) {
      eventData.putDouble("value", (Double) value);
    } else if (valueClass == String.class) {
      eventData.putString("value", value.toString());
    }

    eventData.putInt("index", index);
    eventData.putInt("column", column);

    return eventData;
  }

  // УБИРАЕМ @Override и используем правильную сигнатуру
  public void dispatch(com.facebook.react.uimanager.events.EventDispatcher eventDispatcher) {
    eventDispatcher.dispatchEvent(this);
  }

  @Nullable
  @Override
  protected WritableMap getEventData() {
    return createEventData(mValue, mIndex, mColumn);
  }

  @Override
  public boolean canCoalesce() {
    return false;
  }
}

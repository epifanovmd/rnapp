package com.rnapp.rnwheelpicker;

import com.rnapp.rnwheelpicker.WheelPicker;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.rnapp.rnwheelpicker.events.ItemSelectedEvent;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import android.util.Log;

import java.util.List;

public class Picker extends WheelPicker {

  private List<String> mValueData;
  private int mState;
  private int mColumn;

  public Picker(ReactContext reactContext) {
    super(reactContext);
    setOnWheelChangeListener(new OnWheelChangeListener() {
      @Override
      public void onWheelScrolled(int offset) {
      }

      @Override
      public void onWheelSelected(int index) {
        if (mValueData != null && index < mValueData.size()) {
          dispatchItemSelectedEvent(mValueData.get(index), index, mColumn);
        }
      }

      @Override
      public void onWheelScrollStateChanged(int state) {
        mState = state;
      }
    });
  }

  private void dispatchItemSelectedEvent(Object value, int index, int column) {
    ReactContext reactContext = (ReactContext) getContext();

    if (reactContext.hasActiveReactInstance()) {
      try {
        reactContext
          .getJSModule(RCTEventEmitter.class)
          .receiveEvent(
            getId(),
            ItemSelectedEvent.EVENT_NAME,
            ItemSelectedEvent.createEventData(value, index, column)
          );
      } catch (Exception e) {
        try {
          UIManagerModule uiManager = reactContext.getNativeModule(UIManagerModule.class);
          if (uiManager != null) {
            EventDispatcher eventDispatcher = uiManager.getEventDispatcher();
            if (eventDispatcher != null) {
              ItemSelectedEvent event = new ItemSelectedEvent(getId(), value, index, column);
              eventDispatcher.dispatchEvent(event);
            }
          }
        } catch (Exception ex) {
          ex.printStackTrace();
        }
      }
    }
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec);
  }

  public void setValueData(List<String> data) {
    mValueData = data;
  }

  public void setColumn(int column) {
    mColumn = column;
  }

  public int getState() {
    return mState;
  }
}

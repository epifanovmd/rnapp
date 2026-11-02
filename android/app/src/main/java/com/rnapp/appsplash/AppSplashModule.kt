package com.rnapp.appsplash

import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AppSplashModule(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context), LifecycleEventListener {

    companion object {
        const val NAME = "AppSplash"
    }

    init {
        context.addLifecycleEventListener(this)
    }

    override fun getName() = NAME

    @ReactMethod
    fun hide(fade: Boolean, promise: Promise) =
        AppSplash.hide(reactApplicationContext, fade, promise)

    @ReactMethod
    fun isVisible(promise: Promise) = promise.resolve(AppSplash.isVisible)

    override fun onHostResume() = Unit

    override fun onHostPause() = Unit

    override fun onHostDestroy() = AppSplash.onHostDestroy()
}

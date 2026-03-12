package com.rnapp.rnchatview

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class RNChatViewPackage : BaseReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? = null

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider { emptyMap() }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        listOf(RNChatViewManager())
}

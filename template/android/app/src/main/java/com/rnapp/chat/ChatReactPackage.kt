package com.rnapp.chat.module

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.rnapp.contextmenu.ContextMenuViewManager

/**
 * React Native Package — регистрирует оба ViewManager.
 *
 * Подключение в MainApplication.kt:
 *
 *   override fun getPackages(): List<ReactPackage> =
 *       PackageList(this).packages + listOf(ChatReactPackage())
 */
class ChatReactPackage : ReactPackage {
    override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> = emptyList()
    override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> =
        listOf(ChatViewManager(), ContextMenuViewManager())
}

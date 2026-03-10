package com.rnapp.chat.module

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * React Native Package для нативного чата.
 * Регистрирует только ChatViewManager → "RNChatView".
 *
 * Контекстное меню регистрируется отдельно через ContextMenuReactPackage.
 * Внутри ChatView контекстное меню используется нативно напрямую
 * через ContextMenuOverlay (WindowManager), без RN-моста.
 *
 * Подключение в MainApplication:
 *   add(ChatReactPackage())
 */
class ChatReactPackage : ReactPackage {
    override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> = emptyList()
    override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> =
        listOf(ChatViewManager())
}

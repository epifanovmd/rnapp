package com.rnapp.contextmenu

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Отдельный React Native Package для компонента контекстного меню.
 * Регистрирует ContextMenuViewManager → "RNContextMenuView".
 *
 * Этот пакет независим от ChatReactPackage — компонент можно использовать
 * в любом месте приложения, не только в чате:
 *
 *   <ContextMenuView
 *     menuId={item.id}
 *     emojis={["❤️","👍","😂"]}
 *     actions={[{ id:"delete", title:"Delete", isDestructive: true }]}
 *     onActionSelect={({ actionId }) => handleAction(actionId)}
 *   >
 *     <YourContent />
 *   </ContextMenuView>
 *
 * Подключение в MainApplication — отдельно от ChatReactPackage:
 *   add(ChatReactPackage())
 *   add(ContextMenuReactPackage())
 */
class ContextMenuReactPackage : ReactPackage {
    override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> = emptyList()
    override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> =
        listOf(ContextMenuViewManager())
}

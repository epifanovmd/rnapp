package com.margelo.nitro.visionengine

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Нативных модулей RN пакет не содержит — он нужен autolinking'у как точка
 * старта: инициализация загружает C++ библиотеку и регистрирует
 * hybrid-объект `VisionEngine` в Nitro-реестре.
 */
class VisionEnginePackage : BaseReactPackage() {
  override fun getModule(
    name: String,
    reactContext: ReactApplicationContext,
  ): NativeModule? = null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
    ReactModuleInfoProvider { HashMap() }

  companion object {
    init {
      VisionEngineOnLoad.initializeNative()
    }
  }
}

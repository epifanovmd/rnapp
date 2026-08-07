#include <fbjni/fbjni.h>
#include <jni.h>

#include "OcrEngineOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::ocrengine::initialize(vm);
}

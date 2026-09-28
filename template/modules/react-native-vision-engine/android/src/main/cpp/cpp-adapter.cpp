#include <fbjni/fbjni.h>
#include <jni.h>

#include "VisionEngineOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::visionengine::initialize(vm);
}

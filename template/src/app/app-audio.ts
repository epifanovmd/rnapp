import {
  AudioApiVoiceRecorderBackend,
  setVoiceRecorderBackend,
} from "@shared/ui/input-bar";
import { AudioManager } from "react-native-audio-api";

/**
 * Подключение реального аудио к голосовым сообщениям.
 *
 * Плеер и рекордер объявляют контракты и по умолчанию работают симуляцией —
 * здесь под них подставляются реализации на `react-native-audio-api`. Вызывать
 * один раз при старте приложения, до первого рендера чата.
 */
export const registerAudioBackends = (): void => {
  // RNAudioAPI defaults to the iOS `playback` category. It has no live input,
  // so AudioRecorder cannot materialize the microphone node unless the app
  // switches the session to a recording-capable category first.
  AudioManager.setAudioSessionOptions({
    iosCategory: "playAndRecord",
    iosMode: "default",
    iosOptions: ["allowBluetoothHFP", "defaultToSpeaker"],
    iosAllowHaptics: true,
  });

  setVoiceRecorderBackend(new AudioApiVoiceRecorderBackend());
};

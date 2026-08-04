import { Platform } from "react-native";
import {
  AudioRecorder,
  FileDirectory,
  FileFormat,
} from "react-native-audio-api";
import { PERMISSIONS, request, RESULTS } from "react-native-permissions";

import { IVoiceRecorderBackend, IVoiceRecorderResult } from "./voice-recorder";

/**
 * Бэкенд записи голосовых на `react-native-audio-api`.
 *
 * Пишет в файл силами рекордера, а уровни для волны считает из тех же буферов,
 * что приходят в `onAudioReady`: отдельный проход по файлу не нужен.
 */

/** Буферы уровней: ~46 мс при 44.1 кГц — достаточно частая волна без лишней работы. */
const CALLBACK_OPTIONS = {
  sampleRate: 44100,
  bufferLength: 2048,
  channelCount: 1,
};

const FILE_OPTIONS = {
  format: FileFormat.M4A,
  directory: FileDirectory.Cache,
  fileNamePrefix: "voice-",
};

/** Громкость буфера как RMS — она ближе к воспринимаемой, чем пиковое значение. */
const bufferLevel = (samples: Float32Array): number => {
  if (samples.length === 0) return 0;

  let sum = 0;

  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }

  // Нормировка: речь редко подходит к 1.0, без усиления волна выглядит плоской.
  return Math.min(1, Math.sqrt(sum / samples.length) * 3);
};

/** Доступ к микрофону; бросает, если пользователь его не дал. */
const requireMicrophone = async (): Promise<void> => {
  const permission =
    Platform.OS === "ios"
      ? PERMISSIONS.IOS.MICROPHONE
      : PERMISSIONS.ANDROID.RECORD_AUDIO;

  const status = await request(permission);

  if (status !== RESULTS.GRANTED && status !== RESULTS.LIMITED) {
    throw new Error("Нет доступа к микрофону");
  }
};

export class AudioApiVoiceRecorderBackend implements IVoiceRecorderBackend {
  private _recorder: AudioRecorder | null = null;
  private _levels: number[] = [];

  async start(onLevel: (level: number) => void): Promise<void> {
    await requireMicrophone();

    const recorder = new AudioRecorder();

    this._recorder = recorder;
    this._levels = [];

    const enabled = recorder.enableFileOutput(FILE_OPTIONS);

    if (enabled.status === "error") {
      this._recorder = null;
      throw new Error(enabled.message);
    }

    recorder.onAudioReady(CALLBACK_OPTIONS, ({ buffer }) => {
      const level = bufferLevel(buffer.getChannelData(0));

      this._levels.push(level);
      onLevel(level);
    });

    const started = await recorder.start();

    if (started.status === "error") {
      this._release();
      throw new Error(started.message);
    }
  }

  async stop(): Promise<IVoiceRecorderResult> {
    const recorder = this._recorder;

    if (!recorder) throw new Error("Запись не была начата");

    const waveform = this._levels;
    const result = await recorder.stop();

    this._release();

    if (result.status === "error") throw new Error(result.message);

    return {
      fileUrl: result.paths[0] ?? "",
      duration: result.duration,
      waveform,
    };
  }

  cancel() {
    // Записанный файл остаётся в кеше: рекордер не умеет отменять запись,
    // а система вычистит каталог сама. Результат никого не интересует, но
    // промис нужно погасить — иначе отказ всплывёт как необработанный.
    this._recorder?.stop().catch(() => undefined);
    this._release();
  }

  private _release() {
    this._recorder?.clearOnAudioReady();
    this._recorder?.disableFileOutput();
    this._recorder = null;
    this._levels = [];
  }
}

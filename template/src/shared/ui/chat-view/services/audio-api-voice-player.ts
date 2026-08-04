import {
  AudioBuffer,
  AudioBufferSourceNode,
  AudioContext,
} from "react-native-audio-api";

import { IChatVoicePlayerBackend } from "./voice-player";

/**
 * Бэкенд плеера голосовых на `react-native-audio-api`.
 *
 * Web Audio не отдаёт позицию воспроизведения, поэтому она считается от
 * `context.currentTime`: источник запускается со смещением, а прогресс —
 * разница часов контекста плюс это смещение. Тикер нужен только для отчёта
 * наверх, на сам звук он не влияет.
 */

/** Частота отчётов о прогрессе: чаще незачем — таймер округляется до секунды. */
const PROGRESS_INTERVAL_MS = 100;

export class AudioApiVoicePlayerBackend implements IChatVoicePlayerBackend {
  onProgress?: (progress: number, currentTime: number) => void;
  onEnd?: () => void;

  private _context: AudioContext | null = null;
  private readonly _buffers = new Map<string, AudioBuffer>();
  private _source: AudioBufferSourceNode | null = null;
  private _duration = 0;
  /** Отметка часов контекста в момент запуска источника. */
  private _startedAt = 0;
  /** Позиция, с которой запущен текущий источник, в секундах. */
  private _offset = 0;
  private _timer: ReturnType<typeof setInterval> | null = null;

  async load(url: string, fallbackDuration: number): Promise<number> {
    const context = this._ensureContext();

    let buffer = this._buffers.get(url);

    if (!buffer) {
      buffer = await context.decodeAudioData(url);
      this._buffers.set(url, buffer);
    }

    this._duration = buffer.duration > 0 ? buffer.duration : fallbackDuration;

    return this._duration;
  }

  play(url: string, fromProgress: number) {
    const context = this._ensureContext();
    const buffer = this._buffers.get(url);

    if (!buffer) return;

    this._stopSource();

    const source = context.createBufferSource();

    source.buffer = buffer;
    source.connect(context.destination);
    source.onEnded = () => {
      // Ручная остановка тоже поднимает событие — отличаем по снятому источнику.
      if (this._source !== source) return;
      this._stopTimer();
      this.onEnd?.();
    };

    this._offset = Math.max(0, fromProgress) * this._duration;
    this._startedAt = context.currentTime;
    this._source = source;

    source.start(0, this._offset);
    this._startTimer();
  }

  pause() {
    this._offset = this._elapsed();
    this._stopSource();
  }

  stop() {
    this._offset = 0;
    this._stopSource();
  }

  seek(progress: number) {
    const source = this._source;

    this._offset = Math.max(0, progress) * this._duration;

    // На паузе достаточно сдвинуть точку отсчёта: она применится при play.
    if (!source) {
      this.onProgress?.(progress, this._offset);

      return;
    }

    const context = this._ensureContext();

    this._stopSource();

    const next = context.createBufferSource();

    next.buffer = source.buffer;
    next.connect(context.destination);
    this._startedAt = context.currentTime;
    this._source = next;

    next.start(0, this._offset);
    this._startTimer();
  }

  private _ensureContext(): AudioContext {
    this._context ??= new AudioContext();

    return this._context;
  }

  /** Сколько секунд трека проиграно к текущему моменту. */
  private _elapsed(): number {
    if (!this._context || !this._source) return this._offset;

    const played = this._context.currentTime - this._startedAt;

    return Math.min(this._duration, this._offset + Math.max(0, played));
  }

  private _startTimer() {
    this._stopTimer();
    this._timer = setInterval(() => {
      const elapsed = this._elapsed();
      const progress = this._duration > 0 ? elapsed / this._duration : 0;

      this.onProgress?.(Math.min(1, progress), elapsed);
    }, PROGRESS_INTERVAL_MS);
  }

  private _stopTimer() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  }

  private _stopSource() {
    const source = this._source;

    this._stopTimer();
    this._source = null;

    if (!source) return;

    source.onEnded = null;
    source.stop();
    source.disconnect();
  }
}

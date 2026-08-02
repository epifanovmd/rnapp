/**
 * Запись голоса из панели ввода. Захват микрофона
 * абстрагирован: в проекте нет нативного аудио-модуля, по умолчанию —
 * симуляция (таймер + синтетическая волна). Реальный бэкенд подключается
 * через `setVoiceRecorderBackend`.
 */

export interface IVoiceRecorderResult {
  fileUrl: string;
  duration: number;
  waveform: number[];
}

export interface IVoiceRecorderDelegate {
  onStart?: () => void;
  onUpdateDuration?: (duration: number) => void;
  onUpdateLevel?: (level: number) => void;
  onStop?: (result: IVoiceRecorderResult) => void;
  onCancel?: () => void;
  onFail?: (error: Error) => void;
}

export interface IVoiceRecorderBackend {
  start(onLevel: (level: number) => void): Promise<void>;
  stop(): Promise<IVoiceRecorderResult>;
  cancel(): void;
}

class SimulatedVoiceRecorderBackend implements IVoiceRecorderBackend {
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _startedAt = 0;
  private _samples: number[] = [];
  private _level = 0.4;

  start(onLevel: (level: number) => void): Promise<void> {
    this._startedAt = Date.now();
    this._samples = [];
    this._level = 0.4;
    this._timer = setInterval(() => {
      this._level = Math.min(
        1,
        Math.max(0.08, this._level + (Math.random() - 0.5) * 0.3),
      );
      this._samples.push(this._level);
      onLevel(this._level);
    }, 33);

    return Promise.resolve();
  }

  stop(): Promise<IVoiceRecorderResult> {
    this.stopTimer();

    return Promise.resolve({
      fileUrl: "",
      duration: (Date.now() - this._startedAt) / 1000,
      waveform: this._samples,
    });
  }

  cancel() {
    this.stopTimer();
    this._samples = [];
  }

  private stopTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
}

export class VoiceRecorder {
  delegate: IVoiceRecorderDelegate = {};

  private _backend: IVoiceRecorderBackend = new SimulatedVoiceRecorderBackend();
  private _durationTimer: ReturnType<typeof setInterval> | null = null;
  private _startedAt = 0;
  private _isRecording = false;

  get isRecording(): boolean {
    return this._isRecording;
  }

  setBackend(backend: IVoiceRecorderBackend) {
    this._backend = backend;
  }

  startRecording() {
    this._backend
      .start(level => this.delegate.onUpdateLevel?.(level))
      .then(() => {
        this._isRecording = true;
        this._startedAt = Date.now();
        this._durationTimer = setInterval(() => {
          this.delegate.onUpdateDuration?.(
            (Date.now() - this._startedAt) / 1000,
          );
        }, 33);
        this.delegate.onStart?.();
      })
      .catch((error: Error) => this.delegate.onFail?.(error));
  }

  stopRecording() {
    if (!this._isRecording) return;
    this._isRecording = false;
    this.stopTimer();
    this._backend
      .stop()
      .then(result => this.delegate.onStop?.(result))
      .catch((error: Error) => this.delegate.onFail?.(error));
  }

  cancelRecording() {
    if (!this._isRecording) return;
    this._isRecording = false;
    this.stopTimer();
    this._backend.cancel();
    this.delegate.onCancel?.();
  }

  private stopTimer() {
    if (this._durationTimer) {
      clearInterval(this._durationTimer);
      this._durationTimer = null;
    }
  }
}

let defaultRecorderBackend: IVoiceRecorderBackend | null = null;

export const setVoiceRecorderBackend = (backend: IVoiceRecorderBackend) => {
  defaultRecorderBackend = backend;
};

export const createVoiceRecorder = (): VoiceRecorder => {
  const recorder = new VoiceRecorder();

  if (defaultRecorderBackend) {
    recorder.setBackend(defaultRecorderBackend);
  }

  return recorder;
};

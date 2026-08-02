/**
 * Проигрывание голосовых сообщений: синглтон со состояниями
 * idle/loading/playing/paused/failed и наблюдателями.
 *
 * Аудио-бэкенд абстрагирован: нативного аудио-модуля в проекте нет, поэтому по
 * умолчанию работает симуляция (прогресс по таймеру). Реальный подключается
 * через `setChatVoicePlayerBackend`.
 *
 * Наружу состояние отдаётся **по одному треку и примитивами** (`getStatus`,
 * `getProgress`, `getDisplayTime`): подписка на весь снимок перерисовывала бы
 * каждое голосовое сообщение на экране на каждый тик прогресса.
 */

export type ChatVoiceStatus =
  "idle" | "loading" | "playing" | "paused" | "failed";

export type ChatVoicePlayerState =
  | { type: "idle" }
  | { type: "loading"; url: string }
  | { type: "failed"; url: string }
  | { type: "playing"; url: string; progress: number; currentTime: number }
  | { type: "paused"; url: string; progress: number; currentTime: number };

export type ChatVoicePlayerObserver = (state: ChatVoicePlayerState) => void;

export interface IChatVoicePlayerBackend {
  /** Подготовить трек; resolve — длительность в секундах. */
  load(url: string, fallbackDuration: number): Promise<number>;
  play(url: string, fromProgress: number): void;
  pause(): void;
  stop(): void;
  seek(progress: number): void;
}

/** Симуляция воспроизведения: прогресс идёт по таймеру. */
class SimulatedVoicePlayerBackend implements IChatVoicePlayerBackend {
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _duration = 0;
  private _progress = 0;

  onProgress?: (progress: number, currentTime: number) => void;
  onEnd?: () => void;

  load(_url: string, fallbackDuration: number): Promise<number> {
    this._duration = Math.max(fallbackDuration, 0.1);

    return Promise.resolve(this._duration);
  }

  play(_url: string, fromProgress: number) {
    this._progress = fromProgress;
    this._stopTimer();
    this._timer = setInterval(() => {
      this._progress += 0.05 / this._duration;

      if (this._progress >= 1) {
        this._stopTimer();
        this.onEnd?.();

        return;
      }
      this.onProgress?.(this._progress, this._progress * this._duration);
    }, 50);
  }

  pause() {
    this._stopTimer();
  }

  stop() {
    this._stopTimer();
    this._progress = 0;
  }

  seek(progress: number) {
    this._progress = progress;
    this.onProgress?.(progress, progress * this._duration);
  }

  private _stopTimer() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  }
}

class ChatVoicePlayer {
  private _state: ChatVoicePlayerState = { type: "idle" };
  private readonly _observers = new Set<ChatVoicePlayerObserver>();
  private _backend: IChatVoicePlayerBackend;
  private readonly _durations = new Map<string, number>();

  constructor() {
    const simulated = new SimulatedVoicePlayerBackend();

    simulated.onProgress = (progress, currentTime) => {
      if (this._state.type !== "playing") return;
      this._setState({
        type: "playing",
        url: this._state.url,
        progress,
        currentTime,
      });
    };
    simulated.onEnd = () => this.stop();
    this._backend = simulated;
  }

  get state(): ChatVoicePlayerState {
    return this._state;
  }

  setBackend(backend: IChatVoicePlayerBackend) {
    this.stop();
    this._backend = backend;
  }

  subscribe = (observer: ChatVoicePlayerObserver) => {
    this._observers.add(observer);

    return () => {
      this._observers.delete(observer);
    };
  };

  /** Статус конкретного трека. Для всех, кроме активного, всегда `idle`. */
  getStatus(url: string): ChatVoiceStatus {
    const s = this._state;

    return s.type !== "idle" && s.url === url ? s.type : "idle";
  }

  /** Прогресс трека 0..1 (0 для неактивного). */
  getProgress(url: string): number {
    const s = this._state;

    return (s.type === "playing" || s.type === "paused") && s.url === url
      ? s.progress
      : 0;
  }

  /**
   * Секунды на таймере: у активного трека — прошедшее время, у остальных —
   * полная длительность. Округление до секунды намеренное: подписчик
   * перерисовывается раз в секунду, а не на каждый тик прогресса.
   */
  getDisplayTime(url: string, fallbackDuration: number): number {
    const s = this._state;

    return (s.type === "playing" || s.type === "paused") && s.url === url
      ? Math.floor(s.currentTime)
      : Math.floor(fallbackDuration);
  }

  /** Play/pause по тапу; на неудачно загруженном треке — повторная попытка. */
  toggle(url: string, duration: number) {
    const s = this._state;

    if (s.type !== "idle" && s.url === url) {
      if (s.type === "playing") return this._pause();
      if (s.type === "paused") {
        this._backend.play(url, s.progress);
        this._setState({
          type: "playing",
          url,
          progress: s.progress,
          currentTime: s.currentTime,
        });

        return;
      }
      if (s.type === "loading") return;
    }

    this._play(url, duration);
  }

  stop() {
    this._backend.stop();
    this._setState({ type: "idle" });
  }

  pauseIfPlaying() {
    if (this._state.type === "playing") this._pause();
  }

  seek(progress: number) {
    const s = this._state;

    if (s.type !== "playing" && s.type !== "paused") return;

    const duration = this._durations.get(s.url) ?? 0;

    this._backend.seek(progress);
    this._setState({
      type: s.type,
      url: s.url,
      progress,
      currentTime: progress * duration,
    });
  }

  private _play(url: string, duration: number) {
    this._backend.stop();
    this._setState({ type: "loading", url });

    this._backend
      .load(url, duration)
      .then(realDuration => {
        if (this._state.type !== "loading" || this._state.url !== url) return;
        this._durations.set(url, realDuration);
        this._backend.play(url, 0);
        this._setState({ type: "playing", url, progress: 0, currentTime: 0 });
      })
      .catch(() => {
        if (this._state.type === "loading" && this._state.url === url) {
          this._setState({ type: "failed", url });
        }
      });
  }

  private _pause() {
    if (this._state.type !== "playing") return;

    this._backend.pause();
    this._setState({
      type: "paused",
      url: this._state.url,
      progress: this._state.progress,
      currentTime: this._state.currentTime,
    });
  }

  private _setState(state: ChatVoicePlayerState) {
    this._state = state;
    this._observers.forEach(observer => observer(state));
  }
}

export const chatVoicePlayer = new ChatVoicePlayer();

export const setChatVoicePlayerBackend = (backend: IChatVoicePlayerBackend) =>
  chatVoicePlayer.setBackend(backend);

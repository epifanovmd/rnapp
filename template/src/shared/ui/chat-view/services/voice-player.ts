/**
 * Проигрывание голосовых сообщений: синглтон со состояниями
 * idle/loading/playing/paused/failed и наблюдателями.
 *
 * Аудио-бэкенд абстрагирован: по умолчанию работает симуляция (прогресс по
 * таймеру, без звука), приложение подставляет реальный через
 * `setChatVoicePlayerBackend` — см. `AudioApiVoicePlayerBackend`.
 *
 * Наружу состояние отдаётся **по одному треку и примитивами** (`getStatus`,
 * `getProgress`, `getDisplayTime`): подписка на весь снимок перерисовывала бы
 * каждое голосовое сообщение на экране на каждый тик прогресса.
 *
 * Играющий трек опознаётся по `trackId` (идентификатору сообщения), а не по
 * ссылке на файл: одна и та же запись может быть в нескольких сообщениях —
 * например переслана, — и по ссылке они неотличимы.
 */

export type ChatVoiceStatus =
  "idle" | "loading" | "playing" | "paused" | "failed";

interface IChatVoiceTrack {
  /** Идентификатор сообщения, к которому относится запись. */
  trackId: string;
  /** Ссылка на файл — нужна только бэкенду. */
  url: string;
}

export type ChatVoicePlayerState =
  | { type: "idle" }
  | ({ type: "loading" } & IChatVoiceTrack)
  | ({ type: "failed" } & IChatVoiceTrack)
  | ({
      type: "playing";
      progress: number;
      currentTime: number;
    } & IChatVoiceTrack)
  | ({
      type: "paused";
      progress: number;
      currentTime: number;
    } & IChatVoiceTrack);

export type ChatVoicePlayerObserver = (state: ChatVoicePlayerState) => void;

export interface IChatVoicePlayerBackend {
  /** Подготовить трек; resolve — длительность в секундах. */
  load(url: string, fallbackDuration: number): Promise<number>;
  play(url: string, fromProgress: number): void;
  pause(): void;
  stop(): void;
  seek(progress: number): void;
  /**
   * Ход воспроизведения. Присваивается плеером при подключении бэкенда —
   * реализации остаётся только вызывать.
   */
  onProgress?: (progress: number, currentTime: number) => void;
  /** Трек доигран до конца. Тоже присваивается плеером. */
  onEnd?: () => void;
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
    this._backend = this._attach(new SimulatedVoicePlayerBackend());
  }

  get state(): ChatVoicePlayerState {
    return this._state;
  }

  setBackend(backend: IChatVoicePlayerBackend) {
    this.stop();
    this._backend = this._attach(backend);
  }

  /** Подписать бэкенд на обновление состояния плеера. */
  private _attach(backend: IChatVoicePlayerBackend): IChatVoicePlayerBackend {
    backend.onProgress = (progress, currentTime) => {
      const s = this._state;

      if (s.type !== "playing") return;
      this._setState({
        type: "playing",
        trackId: s.trackId,
        url: s.url,
        progress,
        currentTime,
      });
    };
    backend.onEnd = () => this.stop();

    return backend;
  }

  subscribe = (observer: ChatVoicePlayerObserver) => {
    this._observers.add(observer);

    return () => {
      this._observers.delete(observer);
    };
  };

  /** Статус конкретного трека. Для всех, кроме активного, всегда `idle`. */
  getStatus(trackId: string): ChatVoiceStatus {
    const s = this._state;

    return s.type !== "idle" && s.trackId === trackId ? s.type : "idle";
  }

  /** Прогресс трека 0..1 (0 для неактивного). */
  getProgress(trackId: string): number {
    const s = this._state;

    return (s.type === "playing" || s.type === "paused") &&
      s.trackId === trackId
      ? s.progress
      : 0;
  }

  /**
   * Секунды на таймере: у активного трека — прошедшее время, у остальных —
   * полная длительность. Округление до секунды намеренное: подписчик
   * перерисовывается раз в секунду, а не на каждый тик прогресса.
   */
  getDisplayTime(trackId: string, fallbackDuration: number): number {
    const s = this._state;

    return (s.type === "playing" || s.type === "paused") &&
      s.trackId === trackId
      ? Math.floor(s.currentTime)
      : Math.floor(fallbackDuration);
  }

  /** Play/pause по тапу; на неудачно загруженном треке — повторная попытка. */
  toggle(trackId: string, url: string, duration: number) {
    const s = this._state;

    if (s.type !== "idle" && s.trackId === trackId) {
      if (s.type === "playing") return this._pause();
      if (s.type === "paused") {
        this._backend.play(url, s.progress);
        this._setState({
          type: "playing",
          trackId,
          url,
          progress: s.progress,
          currentTime: s.currentTime,
        });

        return;
      }
      if (s.type === "loading") return;
    }

    this._play(trackId, url, duration);
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
    const next = { trackId: s.trackId, url: s.url, progress };

    this._backend.seek(progress);
    this._setState(
      s.type === "playing"
        ? { type: "playing", ...next, currentTime: progress * duration }
        : { type: "paused", ...next, currentTime: progress * duration },
    );
  }

  private _play(trackId: string, url: string, duration: number) {
    this._backend.stop();
    this._setState({ type: "loading", trackId, url });

    const isStillLoading = () =>
      this._state.type === "loading" && this._state.trackId === trackId;

    this._backend
      .load(url, duration)
      .then(realDuration => {
        if (!isStillLoading()) return;
        this._durations.set(url, realDuration);
        this._backend.play(url, 0);
        this._setState({
          type: "playing",
          trackId,
          url,
          progress: 0,
          currentTime: 0,
        });
      })
      .catch(() => {
        if (isStillLoading()) this._setState({ type: "failed", trackId, url });
      });
  }

  private _pause() {
    const s = this._state;

    if (s.type !== "playing") return;

    this._backend.pause();
    this._setState({
      type: "paused",
      trackId: s.trackId,
      url: s.url,
      progress: s.progress,
      currentTime: s.currentTime,
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

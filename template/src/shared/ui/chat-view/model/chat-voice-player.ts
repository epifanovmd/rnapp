/**
 * Порт VoicePlayer (singleton, состояния idle/loading/playing/paused,
 * наблюдатели). Аудио-бэкенд абстрагирован: в проекте нет нативного
 * аудио-модуля, поэтому по умолчанию используется симуляция воспроизведения
 * (прогресс по таймеру). Реальный бэкенд подключается через
 * `setChatVoicePlayerBackend`.
 */

export type ChatVoicePlayerState =
  | { type: "idle" }
  | { type: "loading"; url: string }
  | { type: "playing"; url: string; progress: number; currentTime: number }
  | { type: "paused"; url: string; progress: number; currentTime: number };

export type ChatVoicePlayerObserver = (state: ChatVoicePlayerState) => void;

export interface IChatVoicePlayerBackend {
  /** Подготовить трек; resolve — длительность в секундах (или переданная). */
  load(url: string, fallbackDuration: number): Promise<number>;
  play(url: string, fromProgress: number): void;
  pause(): void;
  stop(): void;
  seek(progress: number): void;
}

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
    this.stopTimer();
    this._timer = setInterval(() => {
      this._progress += 0.05 / this._duration;
      if (this._progress >= 1) {
        this.stopTimer();
        this.onEnd?.();

        return;
      }
      this.onProgress?.(this._progress, this._progress * this._duration);
    }, 50);
  }

  pause() {
    this.stopTimer();
  }

  stop() {
    this.stopTimer();
    this._progress = 0;
  }

  seek(progress: number) {
    this._progress = progress;
    this.onProgress?.(progress, progress * this._duration);
  }

  private stopTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
}

class ChatVoicePlayer {
  private _state: ChatVoicePlayerState = { type: "idle" };
  private readonly _observers = new Set<ChatVoicePlayerObserver>();
  private _backend: IChatVoicePlayerBackend;
  private _durations = new Map<string, number>();

  constructor() {
    const simulated = new SimulatedVoicePlayerBackend();

    simulated.onProgress = (progress, currentTime) => {
      if (this._state.type !== "playing") return;
      this.setState({
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

  get stateUrl(): string | null {
    return this._state.type === "idle" ? null : this._state.url;
  }

  setBackend(backend: IChatVoicePlayerBackend) {
    this.stop();
    this._backend = backend;
  }

  addObserver(observer: ChatVoicePlayerObserver) {
    this._observers.add(observer);

    return () => {
      this._observers.delete(observer);
    };
  }

  toggle(url: string, duration: number) {
    const s = this._state;

    if (s.type === "playing" && s.url === url) {
      this.pause();

      return;
    }
    if (s.type === "paused" && s.url === url) {
      this._backend.play(url, s.progress);
      this.setState({
        type: "playing",
        url,
        progress: s.progress,
        currentTime: s.currentTime,
      });

      return;
    }
    this.play(url, duration);
  }

  stop() {
    this._backend.stop();
    this.setState({ type: "idle" });
  }

  pauseIfPlaying() {
    if (this._state.type === "playing") {
      this.pause();
    }
  }

  seek(progress: number) {
    const s = this._state;

    if (s.type !== "playing" && s.type !== "paused") return;

    const duration = this._durations.get(s.url) ?? 0;

    this._backend.seek(progress);
    this.setState({
      type: s.type,
      url: s.url,
      progress,
      currentTime: progress * duration,
    });
  }

  private play(url: string, duration: number) {
    this._backend.stop();
    this.setState({ type: "loading", url });

    this._backend
      .load(url, duration)
      .then(realDuration => {
        if (this._state.type !== "loading" || this._state.url !== url) return;
        this._durations.set(url, realDuration);
        this._backend.play(url, 0);
        this.setState({ type: "playing", url, progress: 0, currentTime: 0 });
      })
      .catch(() => {
        if (this._state.type === "loading" && this._state.url === url) {
          this.setState({ type: "idle" });
        }
      });
  }

  private pause() {
    if (this._state.type !== "playing") return;

    this._backend.pause();
    this.setState({
      type: "paused",
      url: this._state.url,
      progress: this._state.progress,
      currentTime: this._state.currentTime,
    });
  }

  private setState(state: ChatVoicePlayerState) {
    this._state = state;
    this._observers.forEach(observer => observer(state));
  }
}

export const chatVoicePlayer = new ChatVoicePlayer();

export const setChatVoicePlayerBackend = (backend: IChatVoicePlayerBackend) =>
  chatVoicePlayer.setBackend(backend);

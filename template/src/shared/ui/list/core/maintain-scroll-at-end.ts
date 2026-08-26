import type { ListStore } from "../model";

/** Доступ к нативному скроллу. */
export interface IScrollAdapter {
  scrollToEnd: (animated: boolean) => void;
  scrollToOffset: (offset: number, animated: boolean) => void;
  /** Фактическое смещение нативного скролла — нужно сверке компенсации. */
  getOffset?: () => number;
}

export interface IMaintainScrollAtEndOptions {
  store: ListStore;
  adapter: () => IScrollAdapter | undefined;
  /** Прилипание выключено, пока проп не задан. */
  enabled: boolean;
  animated: boolean;
}

/** Сколько ждать завершения анимированного прилипания, мс. */
const ANIMATED_SETTLE_MS = 500;

/**
 * Прилипание к концу списка при добавлении контента.
 *
 * Скролл откладывается на следующий кадр: к этому моменту новый контент уже
 * разложен, и конец списка посчитан по фактическим размерам. На кадре условие
 * перепроверяется — если пользователь успел отвести список от конца, прилипание
 * отменяется, чтобы не выдёргивать ленту у него из-под пальца.
 *
 * Пока идёт одно прилипание, повторные запросы копятся в один отложенный и
 * выполняются после завершения.
 */
export class MaintainScrollAtEnd {
  private options: IMaintainScrollAtEndOptions;

  private phase: "idle" | "pending" | "active" = "idle";
  private queued = false;

  constructor(options: IMaintainScrollAtEndOptions) {
    this.options = options;
  }

  setOptions(options: IMaintainScrollAtEndOptions): void {
    this.options = options;
  }

  /** Идёт программное прилипание — пороги кромок в это время не проверяются. */
  isActive(): boolean {
    return this.phase !== "idle";
  }

  /** Запросить прилипание. Возвращает true, если оно будет выполнено. */
  run(): boolean {
    const { store, enabled } = this.options;

    if (!enabled || !store.peek("isWithinMaintainScrollAtEndThreshold")) {
      this.queued = false;

      return false;
    }

    if (this.phase !== "idle") {
      this.queued = true;

      return true;
    }

    this.queued = false;
    this.phase = "pending";

    requestAnimationFrame(() => this.commit());

    return true;
  }

  private commit(): void {
    const { store, adapter, animated } = this.options;

    // За кадр пользователь мог увести список от конца — прилипание отменяется.
    if (!store.peek("isWithinMaintainScrollAtEndThreshold")) {
      this.phase = "idle";

      return;
    }

    this.phase = "active";
    adapter()?.scrollToEnd(animated);

    const settle = () => {
      if (this.phase !== "active") return;

      this.phase = "idle";

      if (this.queued) this.run();
    };

    if (animated) {
      setTimeout(settle, ANIMATED_SETTLE_MS);
    } else {
      settle();
    }
  }
}

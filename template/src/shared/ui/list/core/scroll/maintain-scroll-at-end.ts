import type { ListStore } from "../../model";
import type { ScrollAdapterRef } from "./scroll-adapter";

/** Сколько ждать завершения анимированного прилипания, мс. */
const ANIMATED_SETTLE_MS = 500;

/** Настройки автоприлипания к концу списка. */
export interface IMaintainScrollAtEndOptions {
  store: ListStore;
  adapter: ScrollAdapterRef;
  /** Прилипание выключено, пока проп не задан. */
  enabled: boolean;
  animated: boolean;
}

/**
 * Прилипание к концу списка при добавлении контента.
 *
 * Зачем нужно: в переписке новое сообщение обязано оказаться на экране само,
 * без скролла руками.
 *
 * Какие проблемы решает:
 * - скролл откладывается на следующий кадр: к этому моменту новый контент уже
 *   разложен, и конец списка посчитан по фактическим размерам, а не по оценкам;
 * - на этом кадре условие перепроверяется — если пользователь успел отвести
 *   список от конца, прилипание отменяется, чтобы не выдёргивать ленту у него
 *   из-под пальца;
 * - пока идёт одно прилипание, повторные запросы копятся в один отложенный:
 *   пачка сообщений не должна давать пачку конкурирующих скроллов.
 */
export class MaintainScrollAtEnd {
  private options: IMaintainScrollAtEndOptions;

  private phase: "idle" | "pending" | "active" = "idle";
  private queued = false;

  constructor(options: IMaintainScrollAtEndOptions) {
    this.options = options;
  }

  /** Новые настройки: список пересоздаёт их на каждом рендере. */
  setOptions(options: IMaintainScrollAtEndOptions): void {
    this.options = options;
  }

  /** Идёт программное прилипание — пороги кромок в это время не проверяются. */
  isActive(): boolean {
    return this.phase !== "idle";
  }

  /** Запросить прилипание. @returns true, если оно будет выполнено. */
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

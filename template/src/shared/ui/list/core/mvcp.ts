import type { ListMetrics, ListStore } from "../model";
import { isListDebugEnabled, listDebug } from "./list-debug";
import type { IScrollAdapter } from "./maintain-scroll-at-end";

export interface IMvcpOptions {
  store: ListStore;
  metrics: ListMetrics;
  adapter: () => IScrollAdapter | undefined;
  /** Смещение скролла, каким его считает список. */
  getScroll: () => number;
  getScrollLength: () => number;
  /** Полная высота контента ScrollView, включая шапку, подвал и распорки. */
  getContentSize: () => number;
  /** Разрешён ли элемент как якорь восстановления. */
  shouldRestorePosition?: (index: number) => boolean;
}

/**
 * Минимальный сдвиг, который вообще доходит до нативного слоя.
 *
 * iOS отбрасывает смещение кадра меньше 0.5pt, Android считает его в целых
 * пикселях. Поэтому компенсация применяется целыми точками, а остаток меньше
 * точки копится до следующего прохода.
 */
const MIN_SHIFT = 1;

/**
 * Сколько ждём подтверждения сдвига, если событий не приходит, мс.
 *
 * Пересчёт диапазона уходит в JS шагами по несколько пикселей, поэтому сдвиг
 * меньше шага не порождает ни одного события. Без страховки ожидание висело бы
 * до следующего скролла, а вместе с ним — блокировка порогов кромок.
 */
const CONFIRM_TIMEOUT_MS = 250;

/** Через столько кадров сверяется фактически применённый сдвиг. */
const VERIFY_FRAMES = 2;

/**
 * Сколько запасных якорей снимать.
 *
 * Первая видимая строка вполне может не пережить то самое изменение, ради
 * которого якорь и снимался: строка загрузки наверху исчезает ровно тогда,
 * когда приходит подгруженная порция. Без запасных компенсация в этот момент
 * не выполнялась бы вовсе.
 */
const ANCHOR_CANDIDATES = 4;

/** Смещение строки на экране меньше этого не считается заметным. */
const SCREEN_EPSILON = 0.5;

/**
 * Дальше этой суммарной компенсации смещение распорки теряет точность.
 *
 * Позиция распорки — `BIAS + adjust`, а Yoga хранит её во float32: целые
 * значения точны только до 2^24. Запас до предела логируется, чтобы упереться
 * в него не молча.
 */
const ADJUST_SAFE_LIMIT = 4_000_000;

/** Якорь: элемент и его позиция до изменения раскладки. */
interface IAnchor {
  key: string;
  index: number;
  position: number;
  /** Смещение скролла на момент снятия — только для логов. */
  scroll: number;
}

/**
 * Удержание видимой позиции при изменениях выше вьюпорта.
 *
 * Работает по якорю: перед изменением запоминается первый элемент, который
 * пользователь видит, и его позиция в координатах контента. После пересчёта
 * разница позиций якоря — это ровно то, на сколько уехал контент под ним, и
 * ровно на столько нужно подвинуть скролл.
 *
 * Мерить нужно именно разницу позиций, а не расстояние якоря до кромки
 * вьюпорта. Между снятием якоря и пересчётом проходит кадр, и за этот кадр
 * пользователь успевает проскроллить: расстояние до кромки меняется вместе со
 * скроллом, и его собственное движение попало бы в компенсацию вторым разом.
 * Разница позиций от скролла не зависит вовсе.
 *
 * Сам сдвиг выполняет нативный ScrollView. Ему передан
 * `maintainVisibleContentPosition`, а первым ребёнком контента лежит распорка
 * нулевого размера (`ListScrollAdjust`): нативный код запоминает её кадр перед
 * mount-транзакцией и после неё добавляет смещение кадра к `contentOffset`.
 * Это единственный способ поменять смещение скролла в той же транзакции, что и
 * раскладку — программный `scrollTo` пришёл бы отдельным кадром (видимый
 * прыжок) и оборвал бы жест и инерцию.
 *
 * Поэтому компенсация здесь ничего не скроллит: она только пишет новое
 * положение распорки в тот же синхронный проход, что и позиции контейнеров.
 */
export class MaintainVisibleContentPosition {
  private readonly options: IMvcpOptions;

  /** Якоря сверху вниз: опорой станет первый переживший изменение. */
  private anchors: IAnchor[] = [];

  /**
   * Позиции видимых строк на момент снятия якоря.
   *
   * Компенсация держит на месте якорь, но соседи способны уехать относительно
   * него — если их размеры уточнились в том же проходе. Такое смещение и есть
   * видимое мерцание, а по сдвигу якоря его не найти: там всё сходится.
   * Собирается только под отладкой.
   */
  private screen: { key: string; position: number }[] = [];
  /** Якорь снят и ждёт восстановления. */
  private armed = false;

  /** Накопленное положение распорки, целые точки. */
  private adjust = 0;
  /** Недоведённая доля точки — дожимается следующим проходом. */
  private residual = 0;

  /**
   * Сдвиги, применённые к распорке, но ещё не подтверждённые скроллом.
   *
   * Их бывает несколько подряд: вставка сдвигает по оценочным размерам, а
   * следующий кадр уточняет их измерением. Нативный слой применяет сдвиги по
   * одному, поэтому подтверждать их приходится по очереди.
   */
  private queue: number[] = [];
  /** Смещение до первого неподтверждённого сдвига. */
  private base = 0;
  private queueTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor(options: IMvcpOptions) {
    this.options = options;
  }

  /** Идёт компенсация: пороги кромок в это время проверять нельзя. */
  isSettling(): boolean {
    return this.queue.length > 0;
  }

  /**
   * Снять якорь перед изменением раскладки.
   *
   * Повторный вызов до восстановления игнорируется: если в одну пачку попали и
   * измерение ячейки, и смена данных, базой должна остаться раскладка до первого
   * из этих изменений.
   */
  capture(reason: string): void {
    if (this.armed) return;

    this.armed = true;
    this.anchors = [];

    // Строки, чей верх выше кромки вьюпорта. Они видны лишь частью, и своим
    // размером тянут за собой всё, что под ними: изменись такая строка — и
    // удержанным окажется её верх, а весь видимый контент уедет. Годятся они
    // только когда других во вьюпорте нет вовсе.
    const partial: IAnchor[] = [];

    const { metrics, getScroll, getScrollLength, shouldRestorePosition } =
      this.options;
    const scroll = getScroll();
    const count = metrics.getCount();

    if (count === 0) return;

    const viewportEnd = scroll + getScrollLength();
    const first = metrics.findIndexAtOffset(scroll);

    for (let index = first; index < count; index++) {
      const key = metrics.getKey(index);

      if (key === undefined) break;

      const position = metrics.getPosition(index);

      // Элемент целиком выше вьюпорта — его сдвиг пользователь не увидит.
      if (position + metrics.getSize(index) <= scroll) continue;

      // Вьюпорт кончился: дальше искать нечего.
      if (position > viewportEnd) break;

      // У неизмеренного элемента позиция оценочная: доводить по ней нечего.
      if (!metrics.hasMeasured(key)) continue;
      if (shouldRestorePosition && !shouldRestorePosition(index)) continue;

      if (position < scroll) {
        partial.push({ key, index, position, scroll });
        continue;
      }

      this.anchors.push({ key, index, position, scroll });

      if (this.anchors.length >= ANCHOR_CANDIDATES) break;
    }

    if (this.anchors.length === 0) this.anchors = partial;

    const anchor = this.anchors[0];

    if (!anchor) {
      listDebug("mvcp", "якорь не найден", { reason, scroll, first, count });

      return;
    }

    listDebug("mvcp", "якорь снят", {
      reason,
      index: anchor.index,
      key: anchor.key,
      position: anchor.position,
      scroll,
      spare: this.anchors.length - 1,
    });
    this.snapshotScreen(first, viewportEnd);
  }

  /** Экранные позиции видимых строк — база для поиска уехавших соседей. */
  private snapshotScreen(first: number, viewportEnd: number): void {
    this.screen = [];

    if (!isListDebugEnabled("mvcp")) return;

    const { metrics } = this.options;
    const count = metrics.getCount();

    for (let index = first; index < count; index++) {
      const key = metrics.getKey(index);

      if (key === undefined) break;

      const position = metrics.getPosition(index);

      if (position > viewportEnd) break;

      this.screen.push({ key, position });
    }
  }

  /**
   * Строки, уехавшие относительно применённого сдвига.
   *
   * Меряется не экранная позиция: между снятием якоря и пересчётом пользователь
   * успевает проскроллить сам, и это движение попало бы в отчёт как ошибка.
   * Смысл имеет только разница между тем, на сколько уехала строка, и тем, на
   * сколько сдвинулся скролл, — у якоря она ноль по построению, а у соседей
   * может не быть, и вот это и видно как мерцание.
   */
  private reportScreen(reason: string, applied: number): void {
    const snapshot = this.screen;

    this.screen = [];

    const { metrics } = this.options;

    for (const entry of snapshot) {
      const position = metrics.getPositionByKey(entry.key);

      if (position === undefined) continue;

      const moved = position - entry.position;
      const drift = moved - applied;

      if (Math.abs(drift) <= SCREEN_EPSILON) continue;

      listDebug("mvcp", "строка уехала на экране", {
        reason,
        key: entry.key,
        moved,
        applied,
        drift,
      });
    }
  }

  /**
   * Первый якорь, переживший изменение.
   *
   * Строка могла исчезнуть из данных — тогда её позиция ничего не значит, и
   * опорой становится следующая из снятых.
   */
  private resolveAnchor(): { anchor: IAnchor; position: number } | undefined {
    for (const anchor of this.anchors) {
      const position = this.options.metrics.getPositionByKey(anchor.key);

      if (position !== undefined) return { anchor, position };
    }

    return undefined;
  }

  /**
   * На сколько уехал якорь по текущей раскладке. Якорь не расходуется —
   * значение нужно тем, кому раскладку ещё предстоит уточнить.
   */
  peekShift(): number {
    if (!this.armed) return 0;

    const resolved = this.resolveAnchor();

    return resolved ? resolved.position - resolved.anchor.position : 0;
  }

  /**
   * Компенсировать сдвиг якоря. Возвращает смещение, каким список должен
   * считать скролл.
   */
  restore(reason: string): number {
    const scroll = this.options.getScroll();

    if (!this.armed) return scroll;

    this.armed = false;

    const captured = this.anchors;
    const resolved = this.resolveAnchor();

    this.anchors = [];

    if (captured.length === 0) return scroll;

    // Ни один из снятых якорей не пережил изменение: восстанавливать не по
    // чему, накопленный остаток сбрасывается.
    if (!resolved) {
      this.residual = 0;
      this.screen = [];
      listDebug("mvcp", "якоря исчезли", {
        reason,
        first: captured[0]!.key,
        count: captured.length,
      });

      return scroll;
    }

    const { anchor, position } = resolved;
    const { store, getScrollLength } = this.options;

    if (anchor !== captured[0]) {
      listDebug("mvcp", "якорь заменён", {
        reason,
        was: captured[0]!.key,
        now: anchor.key,
      });
    }

    const wanted = position - anchor.position + this.residual;
    const maxScroll = Math.max(
      0,
      this.options.getContentSize() - getScrollLength(),
    );
    // ScrollView сам подтягивает смещение к новой границе, когда контент стал
    // короче: у конца списка удаление сверху уже сдвинуло скролл ровно на
    // высоту удалённого. Считать эту часть своей — значит сделать её дважды.
    const settled = Math.min(scroll, maxScroll);
    const target = Math.min(Math.max(0, scroll + wanted), maxScroll);
    const exact = target - settled;
    const applied = Math.round(exact);

    // Долю точки копим, только когда сдвиг прошёл целиком: у границы контента
    // доводить уже нечего.
    this.residual = target === scroll + wanted ? exact - applied : 0;

    if (settled !== scroll) {
      listDebug("mvcp", "скролл подтянут границей", {
        reason,
        scroll,
        settled,
        maxScroll,
        byScrollView: settled - scroll,
      });
    }

    if (target !== scroll + wanted) {
      listDebug("mvcp", "упор в границы", {
        reason,
        want: scroll + wanted,
        target,
        maxScroll,
        lost: scroll + wanted - target,
      });
    }

    if (Math.abs(applied) < MIN_SHIFT) {
      listDebug("mvcp", "сдвиг не нужен", {
        reason,
        key: anchor.key,
        index: anchor.index,
        wanted,
        residual: this.residual,
      });
      this.reportScreen(reason, 0);

      return settled;
    }

    this.adjust += applied;
    store.set("scrollAdjust", this.adjust);
    this.enqueue(applied, settled);

    const next = settled + applied;

    listDebug("mvcp", "сдвиг", {
      reason,
      key: anchor.key,
      index: anchor.index,
      moved: position - anchor.position,
      settled,
      // Скролл на снятии и на восстановлении: расхождение — это то, что
      // пользователь успел проскроллить сам, и в компенсацию оно не входит.
      scrollAtCapture: anchor.scroll,
      scroll,
      next,
      applied,
      residual: this.residual,
      adjust: this.adjust,
      contentSize: this.options.getContentSize(),
      anchorScroll: anchor.scroll,
      scrollLength: getScrollLength(),
    });

    if (Math.abs(this.adjust) > ADJUST_SAFE_LIMIT) {
      listDebug("mvcp", "распорка у предела точности", {
        adjust: this.adjust,
        limit: ADJUST_SAFE_LIMIT,
      });
    }

    this.reportScreen(reason, applied);
    this.verify(applied);

    return next;
  }

  private enqueue(applied: number, scroll: number): void {
    if (this.queue.length === 0) this.base = scroll;

    this.queue.push(applied);

    if (this.queueTimeout) clearTimeout(this.queueTimeout);

    this.queueTimeout = setTimeout(() => {
      this.queueTimeout = undefined;

      if (this.queue.length === 0) return;

      listDebug("mvcp", "сдвиг не подтверждён", {
        pending: this.queue.length,
        base: this.base,
      });

      this.queue = [];
    }, CONFIRM_TIMEOUT_MS);
  }

  /**
   * Событие скролла отправлено до применения сдвига.
   *
   * Между записью распорки и правкой `contentOffset` проходит mount-транзакция,
   * и события, отправленные до неё, несут прежнее смещение. Принять такое —
   * значит откатить только что сделанный сдвиг и на следующем проходе сделать
   * его снова: на экране это дрожание и мигание ячеек на кромках.
   *
   * Сдвигов в очереди бывает несколько, и нативный слой применяет их по
   * одному. Поэтому событие относится к ближайшей из возможных промежуточных
   * позиций — от прежнего смещения до полностью применённого. Всё, что до неё,
   * считается подтверждённым. Порогов здесь нет: при живом жесте смещение
   * уезжает от всех кандидатов одинаково, а разделяет их величина сдвигов.
   */
  isStaleScroll(offset: number): boolean {
    if (this.queue.length === 0) return false;

    let candidate = this.base;
    let bestDistance = Math.abs(offset - candidate);
    let confirmed = 0;
    let total = 0;

    for (let index = 0; index < this.queue.length; index++) {
      total += this.queue[index]!;
      candidate += this.queue[index]!;

      const distance = Math.abs(offset - candidate);

      if (distance >= bestDistance) continue;

      bestDistance = distance;
      confirmed = index + 1;
    }

    // Смещение ушло дальше любой из ожидаемых позиций — это уже не эхо сдвига,
    // а живой жест. Держать его за устаревшее — значит заморозить диапазон
    // отрисовки под пальцем.
    if (bestDistance > Math.abs(total)) {
      this.clearQueue();
      listDebug("mvcp", "смещение ушло вперёд", { offset, base: this.base });
      this.base = offset;

      return false;
    }

    for (let index = 0; index < confirmed; index++) {
      this.base += this.queue[index]!;
    }

    this.queue = this.queue.slice(confirmed);

    if (this.queue.length === 0) {
      this.clearQueue();

      listDebug("mvcp", "сдвиг доехал", {
        offset,
        expected: this.base,
        error: offset - this.base,
      });

      return false;
    }

    listDebug("mvcp", "событие устарело", {
      offset,
      reached: this.base,
      pending: this.queue.length,
    });

    return true;
  }

  /**
   * Сверка фактически применённого сдвига.
   *
   * Единственная честная проверка: нативное смещение обязано измениться ровно
   * на то, что мы запросили. `error` — это пиксели, на которые контент уехал на
   * глазах у пользователя. Значение врёт только при живом жесте: туда попадает
   * и то, что пользователь проскроллил сам.
   *
   * Только под отладкой: чтение shared value из JS ходит на UI-поток и
   * блокирует вызывающий, в рабочем пути такому не место.
   */
  private verify(applied: number): void {
    if (!isListDebugEnabled("mvcp")) return;

    const before = this.options.adapter()?.getOffset?.();

    if (before === undefined) return;

    let frames = 0;

    const tick = () => {
      if (++frames < VERIFY_FRAMES) {
        requestAnimationFrame(tick);

        return;
      }

      const after = this.options.adapter()?.getOffset?.();

      if (after === undefined) return;

      listDebug("mvcp", "проверка", {
        applied,
        before,
        after,
        realized: after - before,
        error: after - before - applied,
      });
    };

    requestAnimationFrame(tick);
  }

  private clearQueue(): void {
    this.queue = [];

    if (this.queueTimeout) clearTimeout(this.queueTimeout);

    this.queueTimeout = undefined;
  }

  /** Сброс состояния: применённая компенсация остаётся, ожидания снимаются. */
  reset(): void {
    this.armed = false;
    this.anchors = [];
    this.screen = [];
    this.residual = 0;
    this.clearQueue();
  }
}

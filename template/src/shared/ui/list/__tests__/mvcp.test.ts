import { MaintainVisibleContentPosition } from "../core";
import { ListMetrics, ListStore } from "../model";

const ITEM_SIZE = 100;
const SCROLL_LENGTH = 500;

const keys = (count: number, prefix = "k") =>
  Array.from({ length: count }, (_, index) => `${prefix}${index}`);

/** Стенд: метрики с измеренными элементами и подвижное смещение скролла. */
const createStand = (count = 20, scroll = 1000) => {
  const store = new ListStore();
  const metrics = new ListMetrics({ estimatedItemSize: ITEM_SIZE });
  const state = { scroll };

  const setItems = (nextKeys: string[]) => {
    metrics.setItems(
      nextKeys,
      nextKeys.map(() => ""),
    );
    for (const key of nextKeys) metrics.setMeasuredSize(key, ITEM_SIZE);
  };

  setItems(keys(count));

  const mvcp = new MaintainVisibleContentPosition({
    store,
    metrics,
    adapter: () => undefined,
    getScroll: () => state.scroll,
    getScrollLength: () => SCROLL_LENGTH,
    getContentSize: () => metrics.getTotalSize(),
  });

  return { store, metrics, state, mvcp, setItems };
};

describe("MaintainVisibleContentPosition", () => {
  it("держит якорь на месте при вставке выше вьюпорта", () => {
    const { store, state, mvcp, setItems } = createStand(20, 1000);

    mvcp.capture("тест");
    // Три элемента перед видимой частью: всё ниже уезжает на 300.
    setItems([...keys(3, "new"), ...keys(20)]);

    expect(mvcp.restore("тест")).toBe(1300);
    expect(store.peek("scrollAdjust")).toBe(300);
  });

  it("держит якорь на месте при удалении выше вьюпорта", () => {
    const { store, state, mvcp, setItems } = createStand(20, 1000);

    mvcp.capture("тест");
    setItems(keys(20).slice(2));

    expect(mvcp.restore("тест")).toBe(800);
    expect(store.peek("scrollAdjust")).toBe(-200);
    expect(state.scroll).toBe(1000);
  });

  it("не двигает скролл при изменениях ниже вьюпорта", () => {
    const { store, mvcp, setItems } = createStand(20, 1000);

    mvcp.capture("тест");
    setItems([...keys(20), ...keys(3, "new")]);

    expect(mvcp.restore("тест")).toBe(1000);
    expect(store.peek("scrollAdjust")).toBe(0);
  });

  it("не считает своим сдвигом то, что пользователь проскроллил сам", () => {
    const { store, state, mvcp, setItems } = createStand(20, 1000);

    mvcp.capture("тест");
    // Между снятием якоря и пересчётом пользователь увёл список на 170px.
    state.scroll = 830;
    setItems([...keys(3, "new"), ...keys(20)]);

    // Компенсируется только сдвиг контента, движение пальца в него не входит.
    expect(mvcp.restore("тест")).toBe(1130);
    expect(store.peek("scrollAdjust")).toBe(300);
  });

  it("копит долю точки и дожимает её следующим проходом", () => {
    const { store, metrics, mvcp } = createStand(20, 1000);

    // Элемент выше вьюпорта подрос на дробную величину — до нативного слоя
    // такой сдвиг не доходит, но и потеряться не должен.
    for (let pass = 0; pass < 4; pass++) {
      mvcp.capture("тест");
      metrics.setMeasuredSize("k0", ITEM_SIZE + 0.6 * (pass + 1));
      mvcp.restore("тест");
    }

    expect(store.peek("scrollAdjust")).toBe(2);
  });

  it("не повторяет сдвиг, который ScrollView сделает сам у конца контента", () => {
    // 20 элементов по 100 при вьюпорте 500 — конец списка на 1500.
    const { store, mvcp, setItems } = createStand(20, 1500);

    mvcp.capture("тест");
    setItems(keys(20).slice(3));

    // Контент стал короче на 300, и смещение к новой границе ScrollView
    // подтянет сам — ровно на ту же величину. Свой сдвиг тут не нужен.
    expect(mvcp.restore("тест")).toBe(1200);
    expect(store.peek("scrollAdjust")).toBe(0);
  });

  it("упирается в границы, когда контента под якорь не хватает", () => {
    const { store, mvcp, setItems } = createStand(20, 1000);

    mvcp.capture("тест");
    // Хвост списка исчез: якорь остался, но опустить его на прежнюю строку
    // экрана нечем — ниже него всего один экран контента.
    setItems(keys(20).slice(0, 11));

    // 1100 контента при вьюпорте 500 — дальше 600 скролл не уходит, и туда
    // ScrollView встанет сам.
    expect(mvcp.restore("тест")).toBe(600);
    expect(store.peek("scrollAdjust")).toBe(0);
  });

  it("не опирается на строку, торчащую над кромкой вьюпорта", () => {
    // Скролл посреди строки k9: она видна лишь нижней частью.
    const { store, metrics, mvcp } = createStand(20, 1050);

    mvcp.capture("тест");
    // Та самая частично видимая строка укоротилась. Держать её верх — значит
    // увести вверх весь видимый контент под ней; опора берётся ниже.
    metrics.setMeasuredSize("k9", 40);
    mvcp.restore("тест");

    // k10 стоял на 1000 при скролле 1050 и обязан там и остаться.
    expect(store.peek("scrollAdjust")).toBe(-60);
  });

  it("переходит на запасной якорь, когда первый исчез", () => {
    const { store, mvcp, setItems } = createStand(20, 1000);

    mvcp.capture("тест");
    // Первая видимая строка удалена — так исчезает строка загрузки, когда
    // приходит подгруженная порция. Опорой становится следующая снятая.
    setItems(keys(20).slice(11));

    // m11 стоял на 1100 при скролле 1000, теперь он в начале списка: экран
    // уводится к самому верху, дальше нуля идти некуда.
    expect(mvcp.restore("тест")).toBe(0);
    expect(store.peek("scrollAdjust")).toBe(-400);
  });

  it("отказывается от компенсации, когда не выжил ни один якорь", () => {
    const { store, mvcp, setItems } = createStand(20, 1000);

    mvcp.capture("тест");
    setItems(keys(20).slice(14));

    expect(mvcp.restore("тест")).toBe(1000);
    expect(store.peek("scrollAdjust")).toBe(0);
  });

  it("отбрасывает событие скролла, отправленное до применения сдвига", () => {
    const { state, mvcp, setItems } = createStand(20, 1000);

    mvcp.capture("тест");
    setItems([...keys(3, "new"), ...keys(20)]);
    state.scroll = mvcp.restore("тест");

    expect(mvcp.isStaleScroll(1004)).toBe(true);
    expect(mvcp.isStaleScroll(1300)).toBe(false);
    expect(mvcp.isSettling()).toBe(false);
  });

  it("подтверждает очередь сдвигов по одному", () => {
    const { metrics, state, mvcp, setItems } = createStand(20, 1000);

    // Вставка по оценочным размерам, следом уточнение измерением: нативный
    // слой применяет такие сдвиги по очереди.
    mvcp.capture("данные");
    setItems([...keys(3, "new"), ...keys(20)]);
    state.scroll = mvcp.restore("данные");

    mvcp.capture("размер");
    for (const key of keys(3, "new")) metrics.setMeasuredSize(key, 80);
    state.scroll = mvcp.restore("размер");

    expect(state.scroll).toBe(1240);

    // Первый сдвиг доехал, второй ещё нет — событие относится к прошлому.
    expect(mvcp.isStaleScroll(1300)).toBe(true);
    expect(mvcp.isSettling()).toBe(true);

    expect(mvcp.isStaleScroll(1240)).toBe(false);
    expect(mvcp.isSettling()).toBe(false);
  });

  it("не восстанавливает позицию без снятого якоря", () => {
    const { store, mvcp, setItems } = createStand(20, 1000);

    setItems([...keys(3, "new"), ...keys(20)]);

    expect(mvcp.restore("тест")).toBe(1000);
    expect(store.peek("scrollAdjust")).toBe(0);
  });
});

import { getStickyOffset, StickyAnchors } from "../core";
import { ListMetrics } from "../model";

/** Геометрия стенда: группа из трёх сообщений, перед ней разделитель даты. */
const SIZES = [44, 56, 84, 120];
const GAP = 8;
const AVATAR = 36;

const createMetrics = () => {
  const metrics = new ListMetrics({ estimatedItemSize: 100 });
  const keys = ["date", "m0", "m1", "m2"];

  metrics.setItems(keys, ["date", "msg", "msg", "msg"]);
  keys.forEach((key, index) => metrics.setFixedSize(key, SIZES[index]!));

  return metrics;
};

describe("предел аватара с учётом зазора", () => {
  it("берёт верх первого сообщения группы, а не разделитель", () => {
    const metrics = createMetrics();
    const anchors = new StickyAnchors({ metrics });

    // Якорь — хвост группы (индекс 3), начало группы — индекс 1.
    anchors.setConfigs([
      {
        edge: "end",
        indices: [3],
        groupStarts: [1],
        limitInset: GAP,
        size: AVATAR,
      },
    ]);

    // Разделитель на 0, первое сообщение начинается на 44, пузырь — на 52.
    expect(metrics.getPosition(1)).toBe(44);
    expect(anchors.getLimitOf(3)).toBe(44 + GAP);
  });

  it("не поднимает аватар выше верха первого пузыря", () => {
    const metrics = createMetrics();
    const limit = 44 + GAP;
    const position = metrics.getPosition(3);
    const size = metrics.getSize(3);

    // Кромка вьюпорта прошла глубоко внутрь группы — аватар упёрся в предел.
    const offset = getStickyOffset({
      edge: "end",
      position,
      size,
      scrollLength: 100,
      scroll: 0,
      edgeOffset: 0,
      limit,
      stickySize: AVATAR,
    });

    const avatarBottom = position + size + offset;

    expect(avatarBottom).toBeGreaterThanOrEqual(limit + AVATAR);
    expect(avatarBottom - AVATAR).toBeGreaterThanOrEqual(limit);
  });
});

import { HttpError } from "@shared/lib/http";

import { toHolderPage } from "../main-pagination";

describe("toHolderPage", () => {
  it("отдаёт элементы страницы и общее число", () => {
    const res = toHolderPage({
      data: { items: ["a", "b"], total: 5, offset: 0, limit: 2 },
    });

    expect(res).toEqual({ data: { data: ["a", "b"], totalCount: 5 } });
  });

  it("пробрасывает ошибку без изменений", () => {
    const error = new HttpError({ status: 403, body: null } as never);

    expect(toHolderPage({ error })).toEqual({ error });
  });
});

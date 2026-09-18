import { BaseApi } from "../core/base-api";
import { mapCancelable } from "../core/cancelable";
import type { IHttpClient } from "../core/http-client";
import { createClient, createFakeTransport, ok } from "./test-utils";

class TodoApi extends BaseApi {
  constructor(http: IHttpClient) {
    super(http);
  }

  list(params: { page: number }) {
    return this.get<string[]>("/todos", { params });
  }
  create(title: string) {
    return this.post<{ id: number }, { title: string }>("/todos", { title });
  }
  rename(id: number, title: string) {
    return this.put<void>(`/todos/${id}`, { title }, { auth: false });
  }
  toggle(id: number) {
    return this.patch<void>(`/todos/${id}`, { done: true });
  }
  remove(id: number) {
    return this.delete<void>(`/todos/${id}`);
  }
  /** Пост-обработка ответа с сохранением cancel. */
  titles() {
    return mapCancelable(this.get<{ title: string }[]>("/todos"), res =>
      res.data?.map(t => t.title),
    );
  }
}

describe("BaseApi", () => {
  it("методы собирают HttpRequest и пробрасывают options", async () => {
    const transport = createFakeTransport(req =>
      ok(req.url === "/todos" && req.method === "POST" ? { id: 7 } : null),
    );
    const api = new TodoApi(createClient(transport));

    await api.list({ page: 2 });
    expect((await api.create("x")).data).toEqual({ id: 7 });
    await api.rename(1, "y");
    await api.toggle(1);
    await api.remove(1);

    expect(transport.calls.map(c => [c.method, c.url])).toEqual([
      ["GET", "/todos"],
      ["POST", "/todos"],
      ["PUT", "/todos/1"],
      ["PATCH", "/todos/1"],
      ["DELETE", "/todos/1"],
    ]);
    expect(transport.calls[0].params).toEqual({ page: 2 });
    expect(transport.calls[1].data).toEqual({ title: "x" });
    expect(transport.calls[3].data).toEqual({ done: true });
  });

  it("результат — CancelablePromise, mapCancelable сохраняет cancel", async () => {
    const api = new TodoApi(
      createClient(createFakeTransport(() => ok([{ title: "a" }]))),
    );
    const pending = api.titles();

    expect(typeof pending.cancel).toBe("function");
    expect(await pending).toEqual(["a"]);
  });
});

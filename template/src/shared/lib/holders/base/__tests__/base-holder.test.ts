import { EntityHolder } from "../../entity/entity-holder";

describe("BaseHolder", () => {
  it("exposes every status through computed flags", () => {
    const holder = new EntityHolder<number>();

    expect(holder.isIdle).toBe(true);
    holder.setLoading();
    expect(holder.isLoading).toBe(true);
    expect(holder.isBusy).toBe(true);
    holder.setRefreshing();
    expect(holder.isRefreshing).toBe(true);
    holder.setError("failed");
    expect(holder.isError).toBe(true);
    expect(holder.isReady).toBe(true);
    holder.setData(1);
    expect(holder.isSuccess).toBe(true);
  });
});

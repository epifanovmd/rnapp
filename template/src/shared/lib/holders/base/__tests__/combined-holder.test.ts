import { EntityHolder } from "../../entity/entity-holder";
import { CombinedHolder } from "../combined-holder";

describe("CombinedHolder", () => {
  it("combines loading, refresh, success and error states", () => {
    const first = new EntityHolder<number>();
    const second = new EntityHolder<number>({ initialData: 2 });
    const combined = new CombinedHolder([first, second]);

    first.setLoading();
    expect(combined.isLoading).toBe(true);
    expect(combined.isBusy).toBe(true);
    first.setRefreshing();
    expect(combined.isRefreshing).toBe(true);
    first.setError("failed");
    expect(combined.isError).toBe(true);
    expect(combined.errors).toEqual([{ message: "failed" }]);
    expect(combined.firstError).toEqual({ message: "failed" });
    first.setData(1);
    expect(combined.isSuccess).toBe(true);
    expect(combined.firstError).toBeNull();
  });

  it("uses optional holder state fallbacks", () => {
    const holder = new CombinedHolder([
      { isLoading: false, isError: false, isSuccess: true, error: null },
    ]);

    expect(holder.isRefreshing).toBe(false);
    expect(holder.isBusy).toBe(false);
  });
});

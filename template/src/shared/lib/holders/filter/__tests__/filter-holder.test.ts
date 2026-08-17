import { FilterHolder } from "../filter.holder";
import { filterOptions as options, flush } from "./filter-test-utils";

describe("FilterHolder", () => {
  it("supports single selection, options, apply, cancel and reset", async () => {
    const holder = new FilterHolder({
      title: "Status",
      hint: "Choose status",
      options,
      defaultValue: 1,
      expandable: true,
      expandCount: 2,
    });

    await flush();

    expect(holder.title).toBe("Status");
    expect(holder.hint).toBe("Choose status");
    expect(holder.expanded).toBe(false);
    expect(holder.options).toHaveLength(2);
    expect(holder.hasOptions).toBe(true);
    expect(holder.isEqualValueDefault).toBe(true);
    holder.options[1].onPress();
    expect(holder.value).toBe(2);
    expect(holder.options[1].isActive).toBe(true);
    expect(holder.isDirty).toBe(true);
    holder.apply();
    expect(holder.savedValue).toBe(2);
    holder.setValue(3);
    holder.cancel();
    expect(holder.value).toBe(2);
    holder.resetSoft();
    expect(holder.value).toBe(1);
    holder.resetSoft(3);
    expect(holder.value).toBe(3);
    holder.reset(2);
    expect(holder.value).toBe(2);
    holder.reset();
    expect(holder.value).toBe(1);
    expect(holder.savedValue).toBe(1);
    holder.toggleExpand();
    expect(holder.options).toHaveLength(3);
    holder.cancelExpand();
    expect(holder.expanded).toBe(false);
  });

  it("supports multiple selection and removes already selected values", async () => {
    const holder = new FilterHolder<number, number, true>({
      title: "Multiple",
      options,
      multiple: true,
      defaultValue: [1],
    });

    await flush();

    holder.setValue(2);
    expect(holder.value).toEqual([1, 2]);
    expect(holder.checkActive(2)).toBe(true);
    holder.setValue(1);
    expect(holder.value).toEqual([2]);
    holder.resetSoft([]);
    holder.setValue(3);
    expect(holder.value).toEqual([3]);
    holder.setValue(undefined);
    expect(holder.value).toEqual([3]);

    const empty = new FilterHolder<number, undefined, true>({
      title: "Empty multiple",
      options,
      multiple: true,
    });

    await flush();
    empty.setValue(1);
    expect(empty.value).toEqual([1]);
  });

  it("resets values missing from available options", async () => {
    const holder = new FilterHolder({
      title: "Invalid",
      options,
      defaultValue: 1,
      value: 99,
    });

    await flush();

    holder.apply();
    expect(holder.value).toBe(1);
    expect(holder.savedValue).toBe(1);

    const multiple = new FilterHolder<number, number, true>({
      title: "Invalid multiple",
      options,
      multiple: true,
      defaultValue: [1],
      value: [1, 99],
    });

    await flush();
    multiple.apply();
    expect(multiple.value).toEqual([1]);
  });

  it("loads promised options and recovers from rejected options", async () => {
    let resolve!: (value: typeof options) => void;
    const promised = new Promise<typeof options>(res => {
      resolve = res;
    });
    const holder = new FilterHolder({ title: "Async", options: promised });

    expect(holder.isLoading).toBe(true);
    resolve(options);
    await flush();
    expect(holder.isLoading).toBe(false);
    expect(holder.options).toHaveLength(3);

    const rejected = new FilterHolder<number>({
      title: "Rejected",
      options: Promise.reject(new Error("failed")),
    });

    await flush();
    expect(rejected.isLoading).toBe(false);
    expect(rejected.options).toEqual([]);
  });

  it("supports lazy options and no-op expand cancellation", async () => {
    const holder = new FilterHolder({ title: "Lazy", options: () => options });

    await flush();
    expect(holder.options).toHaveLength(3);
    holder.cancelExpand();
    expect(holder.expanded).toBe(true);

    const empty = new FilterHolder<number>({
      title: "Empty",
      options: [],
      value: 1,
    });

    await flush();
    empty.apply();
    expect(empty.savedValue).toBe(1);

    const unset = new FilterHolder<number>({ title: "Unset", options: [] });

    await flush();
    unset.cancel();
    expect(unset.value).toBeUndefined();
  });
});

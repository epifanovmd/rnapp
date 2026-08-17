import { FilterHolder } from "../filter.holder";
import { FiltersHolder } from "../filters.holder";
import { filterOptions as options, flush } from "./filter-test-utils";

describe("FiltersHolder", () => {
  it("coordinates filters and creates a request from saved values", async () => {
    const status = new FilterHolder({
      title: "Status",
      options,
      defaultValue: 1,
    });
    const category = new FilterHolder({
      title: "Category",
      options,
      defaultValue: 2,
    });
    const holder = new FiltersHolder({ status, category });

    await flush();

    expect(holder.filters).toHaveLength(2);
    expect(holder.isEqual).toBe(true);
    holder.setValue("status", 2);
    expect(holder.isDirty).toBe(true);
    expect(holder.isEqualValueDefault).toBe(false);
    holder.apply();
    expect(holder.activeFiltersCount).toBe(1);
    expect(holder.request).toEqual({ status: 2, category: 2 });
    holder.resetFilterSoft("status");
    holder.resetFilterSoft("category", 3);
    holder.cancel();
    holder.resetFilter("status", 3);
    holder.resetFilter("category");
    holder.resetSoft();
    holder.apply();
    holder.cancelExpand();
    expect(holder.getFilter("status")).toBe(status);
    holder.reset();
    expect(holder.isEqual).toBe(true);
  });
});

import { filterByPeriod } from "../chart-demo-format";
import { REVENUE_VS_EXPENSES } from "../chart-mock-data";

// Индекс графиков тянет Skia; данным нужна только палитра.
jest.mock("@shared/ui/chart", () => ({ seriesColor: () => "#000000" }));

describe("filterByPeriod", () => {
  it("прореживает год до 365 точек и сохраняет последнюю", () => {
    const [revenue] = filterByPeriod(REVENUE_VS_EXPENSES, "year");
    const source = REVENUE_VS_EXPENSES[0].data;

    expect(revenue.data.length).toBeLessThanOrEqual(366);
    expect(revenue.data[revenue.data.length - 1]).toBe(
      source[source.length - 1],
    );
  });

  it("короткий период не прореживает", () => {
    const [week] = filterByPeriod(REVENUE_VS_EXPENSES, "week");
    const source = REVENUE_VS_EXPENSES[0].data;
    const from = week.data[0].x;

    expect(week.data).toEqual(source.filter(datum => datum.x >= from));
  });
});

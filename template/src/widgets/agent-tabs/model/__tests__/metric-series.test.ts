import { memoryPercent, metricSeriesData } from "../metric-series";

jest.mock("@entities/agent", () => ({
  ...jest.requireActual("@entities/agent/lib/metrics"),
}));

describe("metricSeriesData", () => {
  it("ряд по точкам; без значения — пропуск", () => {
    const points = [
      { at: 1, host: { cpuPercent: 10, memUsedBytes: 1, memTotalBytes: 4 } },
      { at: 2, host: { memUsedBytes: 2, memTotalBytes: 4 } },
      { at: 3 },
    ];

    expect(metricSeriesData(points, host => host.cpuPercent)).toEqual([
      { x: 1, y: 10 },
    ]);
    expect(metricSeriesData(points, memoryPercent)).toEqual([
      { x: 1, y: 25 },
      { x: 2, y: 50 },
    ]);
  });
});

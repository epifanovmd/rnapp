import {
  fresherPoint,
  hostMetrics,
  mergeMetricsPoints,
  workerMetrics,
} from "../metrics";

describe("agent metrics", () => {
  it("точки сливаются без повторов, по времени, не старше окна", () => {
    const merged = mergeMetricsPoints(
      [{ at: 10 }, { at: 30 }],
      [{ at: 30 }, { at: 20 }, { at: 5 }],
      8,
    );

    expect(merged.map(point => point.at)).toEqual([10, 20, 30]);
  });

  it("метрики узла: значения не того вида пропускаются", () => {
    const host = hostMetrics({
      cpuPercent: 12.5,
      memUsedBytes: "много",
      cpuCores: [10, "x", 20],
      disks: [{ mount: "/", usedBytes: 1, totalBytes: 2 }, { usedBytes: 3 }],
      temperatures: { maxC: 55 },
    });

    expect(host?.cpuPercent).toBe(12.5);
    expect(host?.memUsedBytes).toBeUndefined();
    expect(host?.cpuCores).toEqual([10, 20]);
    expect(host?.disks).toEqual([{ mount: "/", usedBytes: 1, totalBytes: 2 }]);
    expect(host?.temperatureMaxC).toBe(55);
    expect(hostMetrics(null)).toBeUndefined();
  });

  it("свежая точка — живая, если не старше известной", () => {
    expect(fresherPoint({ at: 5 }, { at: 4 })?.at).toBe(5);
    expect(fresherPoint({ at: 3 }, { at: 4 })?.at).toBe(4);
    expect(fresherPoint(undefined, { at: 4 })?.at).toBe(4);
  });

  it("метрики воркера — его ответ в точке", () => {
    expect(
      workerMetrics({ at: 1, workers: { echo: { jobs: 2 } } }, "echo"),
    ).toEqual({ jobs: 2 });
    expect(workerMetrics(undefined, "echo")).toBeUndefined();
  });
});

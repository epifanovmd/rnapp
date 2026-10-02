import { AUTO_VIRTUAL_THRESHOLD, resolveVirtualConfig } from "../select-defaults";

describe("resolveVirtualConfig", () => {
  it("без настройки — виртуализация только для длинных списков", () => {
    expect(resolveVirtualConfig(undefined, 10)).toBeNull();
    expect(resolveVirtualConfig(undefined, AUTO_VIRTUAL_THRESHOLD + 1)).toEqual(
      { estimateSize: 52, overscan: 8 },
    );
  });

  it("явное false отключает и для длинных", () => {
    expect(resolveVirtualConfig(false, 1000)).toBeNull();
  });

  it("явное true и свои настройки — всегда", () => {
    expect(resolveVirtualConfig(true, 1)).toEqual({
      estimateSize: 52,
      overscan: 8,
    });
    expect(resolveVirtualConfig({ estimateSize: 60 }, 1)).toEqual({
      estimateSize: 60,
      overscan: 8,
    });
  });
});

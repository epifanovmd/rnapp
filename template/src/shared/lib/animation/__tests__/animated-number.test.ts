import type { SharedValue } from "react-native-reanimated";

import { readAnimatedNumber } from "../animated-number";

describe("readAnimatedNumber", () => {
  it("возвращает число как есть", () => {
    expect(readAnimatedNumber(24)).toBe(24);
  });

  it("читает текущее значение shared value", () => {
    const shared = { value: 56 } as SharedValue<number>;

    expect(readAnimatedNumber(shared)).toBe(56);
    shared.value = 80;
    expect(readAnimatedNumber(shared)).toBe(80);
  });
});

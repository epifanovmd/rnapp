import { resolveFreshOffset } from "../scroll-freshness";

const params = {
  offset: 1000,
  live: undefined as number | undefined,
  previous: 0,
  scrollLength: 700,
};

describe("resolveFreshOffset", () => {
  it("оставляет смещение события, пока оно не отстало", () => {
    expect(resolveFreshOffset({ ...params, live: 1100 })).toBe(1000);
  });

  it("берёт живое смещение, когда событие отстало по ходу движения", () => {
    expect(resolveFreshOffset({ ...params, live: 9000 })).toBe(9000);
  });

  it("берёт живое смещение и при движении назад", () => {
    expect(
      resolveFreshOffset({
        ...params,
        offset: 9000,
        previous: 10000,
        live: 1000,
      }),
    ).toBe(1000);
  });

  it("не прыгает против направления события", () => {
    expect(resolveFreshOffset({ ...params, live: 0, previous: 0 })).toBe(1000);
  });

  it("без живого смещения остаётся событие", () => {
    expect(resolveFreshOffset(params)).toBe(1000);
  });

  it("до замера вьюпорта подменять не по чему", () => {
    expect(resolveFreshOffset({ ...params, live: 9000, scrollLength: 0 })).toBe(
      1000,
    );
  });
});

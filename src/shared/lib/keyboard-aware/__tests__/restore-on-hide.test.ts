import {
  computeRestoreOffset,
  restoreFrameOffset,
  shouldRestoreOnHide,
} from "../restore-on-hide";

const flags = {
  enabled: true,
  hasSaved: true,
  userDragged: false,
  interactiveDismiss: false,
};

describe("shouldRestoreOnHide", () => {
  it("без ручного скролла — возвращать", () => {
    expect(shouldRestoreOnHide(flags)).toBe(true);
  });

  it("пользователь скроллил при открытой клавиатуре — остаться", () => {
    expect(shouldRestoreOnHide({ ...flags, userDragged: true })).toBe(false);
  });

  it("interactive dismiss — ручное взаимодействие, без возврата", () => {
    expect(shouldRestoreOnHide({ ...flags, interactiveDismiss: true })).toBe(
      false,
    );
  });

  it("опция выключена или положение не запомнено — без возврата", () => {
    expect(shouldRestoreOnHide({ ...flags, enabled: false })).toBe(false);
    expect(shouldRestoreOnHide({ ...flags, hasSaved: false })).toBe(false);
  });
});

describe("computeRestoreOffset", () => {
  it("запомненное положение в пределах контента", () => {
    expect(computeRestoreOffset(120, 900)).toBe(120);
  });

  it("контент без распорки короче — зажим по концу", () => {
    expect(computeRestoreOffset(500, 300)).toBe(300);
  });
});

describe("restoreFrameOffset", () => {
  it("покадрово от текущего к запомненному по прогрессу закрытия", () => {
    expect(restoreFrameOffset(400, 100, 0.5, 1000)).toBe(250);
  });

  it("не выходит за контент с уменьшающейся распоркой", () => {
    expect(restoreFrameOffset(400, 100, 0.2, 300)).toBe(300);
  });
});

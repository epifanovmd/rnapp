import { shouldCaptureOnEnd } from "../focus-capture";

const base = {
  keyboardHeight: 300,
  hasField: true,
  capturedTarget: 10,
  endTarget: 10,
  pendingRecapture: false,
};

describe("shouldCaptureOnEnd", () => {
  it("поле захвачено в onStart и не менялось — без перезамера", () => {
    expect(shouldCaptureOnEnd(base)).toBe(false);
  });

  it("в onStart тег не пришёл (-1, UITextView) — захват по тегу onEnd", () => {
    expect(
      shouldCaptureOnEnd({ ...base, hasField: false, capturedTarget: -1 }),
    ).toBe(true);
  });

  it("в onStart пришёл тег прежнего поля — захват нового", () => {
    expect(shouldCaptureOnEnd({ ...base, capturedTarget: 7 })).toBe(true);
  });

  it("поле выросло во время анимации — перезамер", () => {
    expect(shouldCaptureOnEnd({ ...base, pendingRecapture: true })).toBe(true);
  });

  it("клавиатура закрылась или тега нет — ничего", () => {
    expect(
      shouldCaptureOnEnd({ ...base, keyboardHeight: 0, capturedTarget: 7 }),
    ).toBe(false);
    expect(
      shouldCaptureOnEnd({ ...base, hasField: false, endTarget: -1 }),
    ).toBe(false);
  });
});

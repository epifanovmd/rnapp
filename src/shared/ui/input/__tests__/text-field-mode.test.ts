import { resolveTextFieldMode } from "../text-field-mode";

describe("resolveTextFieldMode", () => {
  it("обычное поле: ввод разрешён, не триггер, не disabled", () => {
    expect(
      resolveTextFieldMode({
        hasValue: true,
        hasError: false,
        clearable: true,
      }),
    ).toEqual({
      isTrigger: false,
      disabled: false,
      inputEditable: true,
      showClear: true,
    });
  });

  it("поле-триггер не выглядит disabled и запрещает ввод с клавиатуры", () => {
    const mode = resolveTextFieldMode({
      triggerable: true,
      hasValue: false,
      hasError: false,
    });

    expect(mode.isTrigger).toBe(true);
    expect(mode.disabled).toBe(false);
    expect(mode.inputEditable).toBe(false);
  });

  it("в режиме триггера крестик очистки доступен при значении", () => {
    expect(
      resolveTextFieldMode({
        triggerable: true,
        clearable: true,
        hasValue: true,
        hasError: false,
      }).showClear,
    ).toBe(true);
  });

  it("крестика нет без значения или без clearable", () => {
    expect(
      resolveTextFieldMode({
        triggerable: true,
        clearable: true,
        hasValue: false,
        hasError: false,
      }).showClear,
    ).toBe(false);
    expect(
      resolveTextFieldMode({
        triggerable: true,
        hasValue: true,
        hasError: false,
      }).showClear,
    ).toBe(false);
  });

  it("editable=false — настоящий disabled: и у триггера, и у поля ввода, без крестика", () => {
    const trigger = resolveTextFieldMode({
      triggerable: true,
      editable: false,
      clearable: true,
      hasValue: true,
      hasError: false,
    });
    const input = resolveTextFieldMode({
      editable: false,
      clearable: true,
      hasValue: true,
      hasError: false,
    });

    expect(trigger.disabled).toBe(true);
    expect(trigger.showClear).toBe(false);
    expect(input.disabled).toBe(true);
    expect(input.inputEditable).toBe(false);
    expect(input.showClear).toBe(false);
  });

  it("поле ввода с ошибкой прячет крестик, триггер — оставляет", () => {
    expect(
      resolveTextFieldMode({
        clearable: true,
        hasValue: true,
        hasError: true,
      }).showClear,
    ).toBe(false);
    expect(
      resolveTextFieldMode({
        triggerable: true,
        clearable: true,
        hasValue: true,
        hasError: true,
      }).showClear,
    ).toBe(true);
  });
});

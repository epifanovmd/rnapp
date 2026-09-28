import {
  changePasswordSchema,
  codeSchema,
  enable2FASchema,
  usernameSchema,
} from "../validation";

describe("changePasswordSchema", () => {
  it("требует совпадения нового пароля и подтверждения", () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "secret1",
      confirmPassword: "secret2",
    });

    expect(res.success).toBe(false);
    expect(res.error?.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("принимает корректные данные", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "old",
        newPassword: "secret1",
        confirmPassword: "secret1",
      }).success,
    ).toBe(true);
  });
});

describe("codeSchema", () => {
  it("код — ровно 6 цифр", () => {
    expect(codeSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(codeSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(codeSchema.safeParse({ code: "12345a" }).success).toBe(false);
  });
});

describe("usernameSchema", () => {
  it("как на сервере: 5–32 символа a-z, 0-9, _", () => {
    expect(usernameSchema.safeParse({ username: "john_doe" }).success).toBe(
      true,
    );
    expect(usernameSchema.safeParse({ username: "john doe" }).success).toBe(
      false,
    );
    expect(usernameSchema.safeParse({ username: "John_Doe" }).success).toBe(
      false,
    );
    expect(usernameSchema.safeParse({ username: "joe" }).success).toBe(false);
  });
});

describe("enable2FASchema", () => {
  it("подсказка необязательна", () => {
    expect(
      enable2FASchema.safeParse({ currentPassword: "a", password: "secret1" })
        .success,
    ).toBe(true);
  });
});

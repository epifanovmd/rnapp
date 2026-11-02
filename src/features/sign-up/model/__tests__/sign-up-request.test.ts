import { toSignUpRequest } from "../sign-up-request";

const base = { password: "Secret123", confirmPassword: "Secret123" };

describe("toSignUpRequest", () => {
  it("email — поле email, пустые имена не отправляются", () => {
    expect(
      toSignUpRequest({
        ...base,
        login: "user@example.com",
        firstName: " ",
        lastName: "",
      }),
    ).toEqual({
      email: "user@example.com",
      password: "Secret123",
      firstName: undefined,
      lastName: undefined,
    });
  });

  it("телефон — поле phone, имена обрезаются", () => {
    expect(
      toSignUpRequest({
        ...base,
        login: "+79991234567",
        firstName: " Иван ",
        lastName: "Иванов",
      }),
    ).toEqual({
      phone: "+79991234567",
      password: "Secret123",
      firstName: "Иван",
      lastName: "Иванов",
    });
  });

  it("логин не email и не телефон — null", () => {
    expect(toSignUpRequest({ ...base, login: "username" })).toBeNull();
  });
});

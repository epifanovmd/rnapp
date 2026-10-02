import { toProfileFormValues, toProfileUpdate } from "../profile-form-values";

describe("toProfileFormValues", () => {
  it("без профиля — пустая форма", () => {
    expect(toProfileFormValues(null)).toEqual({
      firstName: "",
      lastName: "",
      gender: "",
      birthDate: null,
      locale: "",
    });
  });

  it("null-поля — пустые строки, дата — локальная полночь", () => {
    expect(
      toProfileFormValues({
        firstName: "Иван",
        lastName: null,
        gender: null,
        birthDate: "1990-05-17",
        locale: "ru",
      }),
    ).toEqual({
      firstName: "Иван",
      lastName: "",
      gender: "",
      birthDate: new Date(1990, 4, 17),
      locale: "ru",
    });
  });

  it("дата с временем — берётся календарная часть, мусор — null", () => {
    expect(
      toProfileFormValues({ birthDate: "1990-05-17T00:00:00.000Z" }).birthDate,
    ).toEqual(new Date(1990, 4, 17));
    expect(toProfileFormValues({ birthDate: "не дата" }).birthDate).toBeNull();
  });
});

describe("toProfileUpdate", () => {
  it("пустые поля — null, значения обрезаются", () => {
    expect(
      toProfileUpdate({
        firstName: " Иван ",
        lastName: "",
        gender: " ",
        birthDate: null,
        locale: "en",
      }),
    ).toEqual({
      firstName: "Иван",
      lastName: null,
      gender: null,
      birthDate: null,
      locale: "en",
    });
  });

  it("дата уходит календарной, без сдвига часового пояса", () => {
    expect(
      toProfileUpdate({
        firstName: "",
        lastName: "",
        gender: "",
        birthDate: new Date(1990, 4, 17),
        locale: "",
      }).birthDate,
    ).toBe("1990-05-17");
  });
});

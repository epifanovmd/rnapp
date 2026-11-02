import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useSignInVM } from "../useSignInVM";

jest.mock("@entities/auth", () => ({
  ...jest.requireActual("@entities/auth/model/validation"),
  IAuthStore: {
    useInstance: () => ({
      isLoading: false,
      isTwoFactorRequired: false,
      signIn: jest.fn(),
      verify2FA: jest.fn(),
    }),
  },
}));
jest.mock("@shared/lib/notifications", () => ({
  INotificationService: { useInstance: () => ({ error: jest.fn() }) },
}));
jest.mock("@shared/ui", () => ({
  useZodForm: jest.requireActual("@shared/ui/form/model/use-zod-form")
    .useZodForm,
}));

let vm!: ReturnType<typeof useSignInVM>;

const Probe = () => {
  vm = useSignInVM();

  return null;
};

beforeEach(() => {
  // react-test-renderer предупреждает об устаревании в console.error.
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useSignInVM", () => {
  it("поля входа по умолчанию пустые", async () => {
    await act(async () => {
      TestRenderer.create(createElement(Probe));
    });

    expect(vm.form.getValues()).toEqual({ login: "", password: "" });
  });
});

import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useEnrollAgentVM } from "../useEnrollAgentVM";

const mockApi = {
  getAgentEnrollmentTokens: jest.fn(async () => ({ data: { items: [] } })),
  createAgentEnrollmentToken: jest.fn(),
};

jest.mock("@entities/agent", () => ({
  ...jest.requireActual("@entities/agent/model/validation"),
  IAgentsStore: {
    useInstance: () => ({ release: null, loadRelease: () => undefined }),
  },
  releaseWorkerNames: () => [],
}));
jest.mock("@shared/api", () => ({
  IMainApi: { useInstance: () => mockApi },
}));
jest.mock("@shared/lib/notifications", () => ({
  INotificationService: {
    useInstance: () => ({ error: jest.fn(), success: jest.fn() }),
  },
}));
jest.mock("@shared/ui", () => ({
  useZodForm: jest.requireActual("@shared/ui/form/model/use-zod-form")
    .useZodForm,
  useConfirm: () => async () => true,
}));

const TOKEN_VALUES = {
  name: "eu",
  expiry: "1d" as const,
  singleUse: true,
  labels: undefined,
};

const created = (token: string) => ({
  data: {
    token,
    enrollmentToken: {
      id: token,
      name: "eu",
      prefix: "p",
      uses: 0,
      maxUses: 1,
      expiresAt: null,
      revokedAt: null,
    },
  },
});

let vm!: ReturnType<typeof useEnrollAgentVM>;

const Probe = () => {
  vm = useEnrollAgentVM();

  return null;
};

const render = async () => {
  await act(async () => {
    TestRenderer.create(createElement(Probe));
  });
  await act(async () => vm.openDialog());
};

beforeEach(() => {
  jest.clearAllMocks();
  // react-test-renderer предупреждает об устаревании в console.error.
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useEnrollAgentVM", () => {
  it("шторку смахнули, пока создавался токен, — она открывается снова с токеном", async () => {
    let resolve!: (value: ReturnType<typeof created>) => void;

    mockApi.createAgentEnrollmentToken.mockReturnValue(
      new Promise(done => (resolve = done)),
    );
    await render();

    let pending!: Promise<void>;

    await act(async () => {
      pending = vm.createToken(TOKEN_VALUES);
    });
    await act(async () => {
      vm.setOpen(false);
      vm.onClosed();
    });
    await act(async () => {
      resolve(created("p.secret"));
      await pending;
    });

    expect(vm.open).toBe(true);
    expect(vm.issued).toBe("p.secret");
  });

  it("повторное создание, пока идёт первое, не выпускает второй токен", async () => {
    let resolve!: (value: ReturnType<typeof created>) => void;

    mockApi.createAgentEnrollmentToken.mockReturnValue(
      new Promise(done => (resolve = done)),
    );
    await render();

    await act(async () => {
      const first = vm.createToken(TOKEN_VALUES);
      const second = vm.createToken(TOKEN_VALUES);

      resolve(created("p.secret"));
      await Promise.all([first, second]);
    });

    expect(mockApi.createAgentEnrollmentToken).toHaveBeenCalledTimes(1);
  });
});

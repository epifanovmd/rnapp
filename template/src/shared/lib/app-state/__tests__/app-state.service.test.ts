import { AppStateService } from "../app-state.service";

type Listener = (state: string) => void;

const mockAppState = { currentState: "active", listeners: new Set<Listener>() };

jest.mock("react-native", () => ({
  AppState: {
    get currentState() {
      return mockAppState.currentState;
    },
    addEventListener: (_: string, listener: Listener) => {
      mockAppState.listeners.add(listener);

      return { remove: () => mockAppState.listeners.delete(listener) };
    },
  },
}));

const emit = (state: string) => {
  mockAppState.currentState = state;
  mockAppState.listeners.forEach(listener => listener(state));
};

beforeEach(() => {
  mockAppState.currentState = "active";
  mockAppState.listeners.clear();
});

describe("AppStateService", () => {
  it("сообщает только о смене активности", () => {
    const callback = jest.fn();

    new AppStateService().onChange(callback);
    emit("inactive");
    emit("background");
    emit("active");

    expect(callback.mock.calls).toEqual([[false], [true]]);
  });

  it("повторное active не дублируется", () => {
    const callback = jest.fn();

    new AppStateService().onChange(callback);
    emit("active");

    expect(callback).not.toHaveBeenCalled();
  });

  it("отписка снимает слушатель", () => {
    const callback = jest.fn();
    const dispose = new AppStateService().onChange(callback);

    dispose();
    emit("background");

    expect(callback).not.toHaveBeenCalled();
  });
});

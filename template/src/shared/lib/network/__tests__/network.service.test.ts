import { NetworkStatusService } from "../network.service";

interface IState {
  isConnected: boolean | null;
  isInternetReachable?: boolean | null;
}

type Listener = (state: IState) => void;

const mockListeners = new Set<Listener>();

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    addEventListener: (listener: Listener) => {
      mockListeners.add(listener);

      return () => mockListeners.delete(listener);
    },
  },
}));

const emit = (state: IState) =>
  mockListeners.forEach(listener => listener(state));

beforeEach(() => {
  mockListeners.clear();
});

describe("NetworkStatusService", () => {
  it("onOffline — только на переходе, не на каждое событие", () => {
    const service = new NetworkStatusService();
    const onOffline = jest.fn();

    service.onOffline(onOffline);
    emit({ isConnected: true });
    emit({ isConnected: false });
    emit({ isConnected: false });

    expect(onOffline).toHaveBeenCalledTimes(1);
    expect(service.isOnline).toBe(false);
  });

  it("onOffline не срабатывает на стартовом состоянии", () => {
    const onOffline = jest.fn();

    new NetworkStatusService().onOffline(onOffline);
    emit({ isConnected: false });

    expect(onOffline).not.toHaveBeenCalled();
  });

  it("onOnline — после офлайна", () => {
    const onOnline = jest.fn();

    new NetworkStatusService().onOnline(onOnline);
    emit({ isConnected: true });
    emit({ isConnected: false });
    emit({ isConnected: true });

    expect(onOnline).toHaveBeenCalledTimes(1);
  });

  it("неизвестное состояние (null) ничего не меняет", () => {
    const service = new NetworkStatusService();
    const onOnline = jest.fn();
    const onOffline = jest.fn();

    service.onOnline(onOnline);
    service.onOffline(onOffline);
    emit({ isConnected: true });
    emit({ isConnected: null });
    emit({ isConnected: true });

    expect(onOffline).not.toHaveBeenCalled();
    expect(onOnline).not.toHaveBeenCalled();
    expect(service.isOnline).toBe(true);
  });

  it("сеть без интернета (captive portal) — офлайн", () => {
    const service = new NetworkStatusService();
    const onOnline = jest.fn();

    service.onOnline(onOnline);
    emit({ isConnected: false });
    emit({ isConnected: true, isInternetReachable: false });

    expect(onOnline).not.toHaveBeenCalled();
    expect(service.isOnline).toBe(false);

    emit({ isConnected: true, isInternetReachable: true });

    expect(onOnline).toHaveBeenCalledTimes(1);
  });
});

import { testRuntime } from "./test-runtime";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  testRuntime.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  testRuntime.restoreAllMocks();
  testRuntime.useRealTimers();
});

const globals = globalThis as typeof globalThis & { __TEST_RUNTIME__?: any };

export const testRuntime = globals.__TEST_RUNTIME__;

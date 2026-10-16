import {
  IVoiceRecorderBackend,
  IVoiceRecorderResult,
  VoiceRecorder,
} from "../voice-recorder";

const RESULT: IVoiceRecorderResult = {
  fileUrl: "file://voice.m4a",
  duration: 1,
  waveform: [0.5],
};

interface IDeferredBackend extends IVoiceRecorderBackend {
  /** Завершает отложенный `start` (запрос доступа к микрофону). */
  resolveStart: () => Promise<void>;
  start: jest.Mock;
  stop: jest.Mock;
  cancel: jest.Mock;
}

/** Бэкенд, чей `start` завершается только по команде. */
const createDeferredBackend = (): IDeferredBackend => {
  let resolve: () => void = () => undefined;
  const started = new Promise<void>(done => {
    resolve = done;
  });

  return {
    start: jest.fn(() => started),
    stop: jest.fn(() => Promise.resolve(RESULT)),
    cancel: jest.fn(),
    resolveStart: async () => {
      resolve();
      await started;
      await Promise.resolve();
    },
  };
};

describe("VoiceRecorder", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("отмена до завершения start гасит запись в бэкенде и не запускает таймер", async () => {
    const backend = createDeferredBackend();
    const recorder = new VoiceRecorder();
    const onUpdateDuration = jest.fn();
    const onStart = jest.fn();

    recorder.setBackend(backend);
    recorder.delegate = { onUpdateDuration, onStart };

    recorder.startRecording();
    recorder.cancelRecording();
    await backend.resolveStart();
    jest.advanceTimersByTime(1000);

    expect(backend.cancel).toHaveBeenCalledTimes(1);
    expect(recorder.isRecording).toBe(false);
    expect(onStart).not.toHaveBeenCalled();
    expect(onUpdateDuration).not.toHaveBeenCalled();
  });

  it("остановка до завершения start останавливает запись сразу после старта", async () => {
    const backend = createDeferredBackend();
    const recorder = new VoiceRecorder();
    const onStop = jest.fn();
    const onUpdateDuration = jest.fn();

    recorder.setBackend(backend);
    recorder.delegate = { onStop, onUpdateDuration };

    recorder.startRecording();
    recorder.stopRecording();
    await backend.resolveStart();
    await Promise.resolve();
    jest.advanceTimersByTime(1000);

    expect(backend.stop).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledWith(RESULT);
    expect(recorder.isRecording).toBe(false);
    expect(onUpdateDuration).not.toHaveBeenCalled();
  });

  it("повторный start, пока идёт запуск, бэкенд второй раз не стартует", async () => {
    const backend = createDeferredBackend();
    const recorder = new VoiceRecorder();

    recorder.setBackend(backend);

    recorder.startRecording();
    recorder.startRecording();
    await backend.resolveStart();

    expect(backend.start).toHaveBeenCalledTimes(1);
    expect(recorder.isRecording).toBe(true);

    recorder.cancelRecording();
  });

  it("обычный цикл: старт, тики длительности, остановка с результатом", async () => {
    const backend = createDeferredBackend();
    const recorder = new VoiceRecorder();
    const onStop = jest.fn();
    const onUpdateDuration = jest.fn();

    recorder.setBackend(backend);
    recorder.delegate = { onStop, onUpdateDuration };

    recorder.startRecording();
    await backend.resolveStart();
    jest.advanceTimersByTime(100);
    recorder.stopRecording();
    await Promise.resolve();
    await Promise.resolve();

    expect(onUpdateDuration).toHaveBeenCalled();
    expect(onStop).toHaveBeenCalledWith(RESULT);
    expect(recorder.isRecording).toBe(false);
  });
});

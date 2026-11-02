import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

import {
  IBottomSheetStack,
  TBottomSheetStackConfig,
  TBottomSheetStackSheetProps,
  useBottomSheetStack,
} from "../useBottomSheetStack";

type TKey = "first" | "second" | "third";
type TSheetState = "closed" | "open" | "closing";
type TSheetRefValue = NonNullable<
  TBottomSheetStackSheetProps["ref"]["current"]
>;

interface IFakeHost {
  /** Лист, который сейчас на экране; `null` — идёт анимация закрытия. */
  visible: () => TKey | null;
  attach: (key: TKey, props: TBottomSheetStackSheetProps) => void;
  /** Свайп вниз по верхнему листу. */
  swipeDown: () => void;
  /** Доигрывает анимации закрытия и шлёт отложенные `onDismiss`. */
  flush: () => void;
}

/**
 * Модель `@gorhom/bottom-sheet` со `stackBehavior: "replace"`: закрытие
 * асинхронное (`onDismiss` — только на `flush`) и непрерываемое — `present`
 * по закрывающемуся листу игнорируется, но верхний лист всё равно заменяется.
 */
const createFakeHost = (): IFakeHost => {
  const states = new Map<TKey, TSheetState>();
  const listeners = new Map<TKey, () => void>();
  const closing: TKey[] = [];
  let top: TKey | null = null;

  const startClose = (key: TKey) => {
    states.set(key, "closing");
    closing.push(key);
  };

  const present = (key: TKey) => {
    if (top && top !== key) {
      startClose(top);
    }
    top = key;

    if (states.get(key) === "closing") {
      return;
    }

    states.set(key, "open");
  };

  const dismiss = (key: TKey) => {
    if (states.get(key) !== "open") {
      return;
    }

    startClose(key);
  };

  return {
    visible: () => (top && states.get(top) === "open" ? top : null),
    attach: (key, props) => {
      states.set(key, "closed");
      listeners.set(key, props.onDismiss);
      props.ref.current = {
        present: () => present(key),
        dismiss: () => dismiss(key),
      } as unknown as TSheetRefValue;
    },
    swipeDown: () => {
      if (top) {
        dismiss(top);
      }
    },
    flush: () => {
      while (closing.length > 0) {
        const key = closing.shift() as TKey;

        states.set(key, "closed");

        if (top === key) {
          top = null;
        }

        listeners.get(key)?.();
      }
    },
  };
};

interface IProbeProps {
  config: TBottomSheetStackConfig<TKey>;
  onValue: (stack: IBottomSheetStack<TKey>) => void;
}

const Probe = ({ config, onValue }: IProbeProps) => {
  onValue(useBottomSheetStack(config));

  return null;
};

const renderStack = () => {
  const dismissed: TKey[] = [];
  const config: TBottomSheetStackConfig<TKey> = {
    first: { onDismiss: () => dismissed.push("first") },
    second: { onDismiss: () => dismissed.push("second") },
    third: { onDismiss: () => dismissed.push("third") },
  };

  let stack!: IBottomSheetStack<TKey>;
  const onValue = (value: IBottomSheetStack<TKey>) => {
    stack = value;
  };

  act(() => {
    TestRenderer.create(createElement(Probe, { config, onValue }));
  });

  const host = createFakeHost();

  (Object.keys(config) as TKey[]).forEach(key =>
    host.attach(key, stack.sheets[key]),
  );

  return {
    host,
    dismissed,
    get stack() {
      return stack;
    },
  };
};

describe("useBottomSheetStack", () => {
  it("«Назад» до конца анимации замены возвращает на предыдущий лист", () => {
    const probe = renderStack();

    act(() => probe.stack.present("first"));
    act(() => probe.stack.present("second"));
    act(() => probe.stack.back());
    act(() => probe.host.flush());

    expect(probe.host.visible()).toBe("first");
    expect(probe.stack.activeSheet).toBe("first");
    expect(probe.dismissed).toEqual([]);
  });

  it("запоздавший onDismiss заменённого листа не ломает историю", () => {
    const probe = renderStack();

    act(() => probe.stack.present("first"));
    act(() => probe.stack.present("second"));
    act(() => probe.stack.back());
    act(() => probe.host.flush());

    expect(probe.dismissed).toEqual([]);

    act(() => probe.stack.back());
    act(() => probe.host.flush());

    expect(probe.host.visible()).toBeNull();
    expect(probe.stack.activeSheet).toBeNull();
    expect(probe.dismissed).toEqual(["first"]);
  });

  it("быстрое переключение вперёд-назад-вперёд оставляет стек целым", () => {
    const probe = renderStack();

    act(() => probe.stack.present("first"));
    act(() => probe.stack.present("second"));
    act(() => probe.stack.back());
    act(() => probe.stack.present("second"));
    act(() => probe.host.flush());

    expect(probe.host.visible()).toBe("second");
    expect(probe.stack.activeSheet).toBe("second");
    expect(probe.dismissed).toEqual([]);

    act(() => probe.stack.back());
    act(() => probe.host.flush());

    expect(probe.host.visible()).toBe("first");
    expect(probe.stack.activeSheet).toBe("first");
  });

  it("двойное «Назад» с третьего шага доводит до первого", () => {
    const probe = renderStack();

    act(() => probe.stack.present("first"));
    act(() => probe.stack.present("second"));
    act(() => probe.stack.present("third"));
    act(() => probe.stack.back());
    act(() => probe.stack.back());
    act(() => probe.host.flush());

    expect(probe.host.visible()).toBe("first");
    expect(probe.stack.activeSheet).toBe("first");
    expect(probe.dismissed).toEqual([]);
  });

  it("закрытие стека во время отложенного показа убирает лист с экрана", () => {
    const probe = renderStack();

    act(() => probe.stack.present("first"));
    act(() => probe.stack.present("second"));
    act(() => probe.stack.back());
    act(() => probe.stack.dismiss());
    act(() => probe.host.flush());

    expect(probe.host.visible()).toBeNull();
    expect(probe.stack.activeSheet).toBeNull();
    expect(probe.dismissed).toEqual(["first"]);
  });

  it("свайп вниз закрывает весь стек", () => {
    const probe = renderStack();

    act(() => probe.stack.present("first"));
    act(() => probe.stack.present("second"));
    act(() => probe.host.flush());
    act(() => probe.host.swipeDown());
    act(() => probe.host.flush());

    expect(probe.host.visible()).toBeNull();
    expect(probe.stack.activeSheet).toBeNull();
    expect(probe.dismissed).toEqual(["second"]);
  });

  it("dismiss закрывает стек с любого шага", () => {
    const probe = renderStack();

    act(() => probe.stack.present("first"));
    act(() => probe.stack.present("second"));
    act(() => probe.stack.present("third"));
    act(() => probe.host.flush());
    act(() => probe.stack.dismiss());
    act(() => probe.host.flush());

    expect(probe.host.visible()).toBeNull();
    expect(probe.stack.activeSheet).toBeNull();
    expect(probe.dismissed).toEqual(["third"]);
    expect(probe.stack.isOpen("third")).toBe(false);
  });
});

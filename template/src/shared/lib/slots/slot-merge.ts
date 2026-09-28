import type { AnyProps } from "./slot-meta";

const composeHandlers = (
  first: (...args: any[]) => void,
  second: (...args: any[]) => void,
) => {
  return (...args: any[]) => {
    first(...args);
    second(...args);
  };
};

/** Обработчик события по конвенции RN: `on` + заглавная буква. */
const HANDLER_KEY = /^on[A-Z]/;

const isHandler = (key: string, prev: unknown, next: unknown) =>
  typeof prev === "function" &&
  typeof next === "function" &&
  HANDLER_KEY.test(key);

/**
 * Политики инъекции props владельца в слот. Применяются к паре
 * «props потребителя + inject владельца», inject приоритетнее.
 */
export const mergeSlotProps = {
  /** Инъекция затирает одноимённые props потребителя. */
  replace(props: AnyProps, inject: AnyProps): AnyProps {
    return { ...props, ...inject };
  },

  /**
   * Инъекция дописывается к props потребителя: `style` склеивается, `on*`
   * вызываются оба (сначала потребительский), остальное затирается.
   */
  compose(props: AnyProps, inject: AnyProps): AnyProps {
    const merged: AnyProps = { ...props };

    for (const key of Object.keys(inject)) {
      const next = inject[key];

      if (next === undefined) {
        continue;
      }

      const prev = merged[key];

      if (prev === undefined || prev === null) {
        merged[key] = next;
      } else if (key === "style") {
        merged[key] = [prev, next];
      } else if (isHandler(key, prev, next)) {
        merged[key] = composeHandlers(prev, next);
      } else {
        merged[key] = next;
      }
    }

    return merged;
  },
};

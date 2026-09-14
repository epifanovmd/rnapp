import { isEqual } from "lodash";
import { useRef } from "react";

/**
 * Стабилизация объекта по содержимому: пока значение не изменилось (глубокое
 * сравнение, функции — по ссылке), возвращается прежняя ссылка. Защищает
 * мемоизацию ниже по дереву от объектов, пересоздаваемых на каждый рендер.
 */
export const useStableValue = <T>(value: T): T => {
  const ref = useRef(value);

  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }

  return ref.current;
};

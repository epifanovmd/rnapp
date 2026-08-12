import { useRef } from "react";

/**
 * Значения равны по Object.is, либо это массивы примитивов одного содержимого.
 * Одного вложенного уровня достаточно для плоских конфигов.
 */
const valueEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }

  return a.every((item, i) => Object.is(item, b[i]));
};

const shallowEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  ) {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) return valueEqual(a, b);

  const keysA = Object.keys(a) as (keyof typeof a)[];
  const keysB = Object.keys(b) as (keyof typeof b)[];

  if (keysA.length !== keysB.length) return false;

  return keysA.every(
    key => key in b && valueEqual(a[key as keyof typeof a], b[key]),
  );
};

/**
 * Стабилизация плоского объекта по значению: пока содержимое не изменилось,
 * возвращается прежняя ссылка. Защищает мемоизацию ниже по дереву от
 * инлайн-объектов в пропсах (`features={{ ... }}`), пересоздаваемых на каждый
 * рендер. Сравнение поверхностное плюс поэлементное для массивов примитивов —
 * ровно то, из чего состоят конфиги.
 */
export const useShallowStable = <T>(value: T): T => {
  const ref = useRef(value);

  if (!shallowEqual(ref.current, value)) ref.current = value;

  return ref.current;
};

import { ITheme, TThemeName } from "../types";
import { useTheme } from "./use-theme";

type Generator<T extends object> = (theme: ITheme) => T;

/**
 * Фабрика хука тем-зависимых стилей. Вызывается на уровне модуля:
 *   const useStyles = makeThemeStyles(t => ({ card: { backgroundColor: t.colors.surface } }));
 * Результат генератора кэшируется по имени темы — ссылки на стили стабильны
 * между рендерами и инстансами компонентов.
 */
export const makeThemeStyles = <T extends object>(fn: Generator<T>) => {
  const cache = new Map<TThemeName, T>();

  return function useThemeStyles(): T {
    const { name, colors } = useTheme();

    let styles = cache.get(name);

    if (!styles) {
      styles = fn({ name, colors });
      cache.set(name, styles);
    }

    return styles;
  };
};

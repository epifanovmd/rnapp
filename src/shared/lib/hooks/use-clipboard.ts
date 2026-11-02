import { useCallback, useEffect, useRef, useState } from "react";
import { TurboModuleRegistry } from "react-native";

interface IClipboardModule {
  setString: (text: string) => void;
}

/**
 * Модуль буфера грузится при первом копировании и только если нативная часть
 * есть в бинарнике (без `pod install` её нет). Наличие проверяется заранее:
 * ошибку инициализации модуля Metro в dev показывает фатальной ещё до catch.
 */
const loadClipboard = (): IClipboardModule | null => {
  if (!TurboModuleRegistry.get("RNCClipboard")) return null;

  try {
    return require("@react-native-clipboard/clipboard").default;
  } catch {
    return null;
  }
};

export interface UseClipboardOptions {
  /** Сколько держать `copied`, мс. */
  timeout?: number;
}

/** Копирование в системный буфер с отметкой «скопировано». */
export const useClipboard = ({ timeout = 2000 }: UseClipboardOptions = {}) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  /** `false` — буфер недоступен. */
  const copy = useCallback(
    (text: string): boolean => {
      const clipboard = loadClipboard();

      if (!clipboard) return false;

      clipboard.setString(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), timeout);

      return true;
    },
    [timeout],
  );

  return { copy, copied };
};

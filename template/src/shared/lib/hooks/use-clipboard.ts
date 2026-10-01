import { useCallback, useEffect, useRef, useState } from "react";

interface IClipboardModule {
  setString: (text: string) => void;
}

/**
 * Модуль буфера грузится при первом копировании: в бинарнике без нативной
 * части (не выполнен `pod install`) приложение не падает на старте.
 */
const loadClipboard = (): IClipboardModule | null => {
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

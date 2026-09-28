/** Браузеры в порядке проверки: Edge и Opera притворяются Chrome, Chrome — Safari. */
const BROWSERS: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\//, "Opera"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
  [/curl\//, "curl"],
];

/** Нативные клиенты: HTTP-стек iOS (CFNetwork) и Android (okhttp). */
const APPS: [RegExp, string][] = [
  [/CFNetwork\/.*Darwin\//, "Приложение, iOS"],
  [/okhttp\//, "Приложение, Android"],
];

const SYSTEMS = /(Windows|Mac OS X|Android|iPhone|iPad|Linux)/;

/** Короткое имя клиента из User-Agent: браузер и ОС; `—`, если его нет. */
export const describeUserAgent = (userAgent: string | null): string => {
  if (!userAgent) return "—";

  const app = APPS.find(([pattern]) => pattern.test(userAgent))?.[1];

  if (app) return app;

  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
  const os = SYSTEMS.exec(userAgent)?.[1];

  return [browser, os].filter(Boolean).join(", ") || userAgent.slice(0, 40);
};

import { optionalTextSchema, workerNameSchema } from "@entities/agent";
import type { AgentEnrollmentTokenDto } from "@shared/api/gen/main/model";
import { z } from "zod";

/** Срок действия токена регистрации. */
export const TOKEN_EXPIRY_OPTIONS = [
  { value: "1h", label: "1 час", ms: 3_600_000 },
  { value: "1d", label: "1 день", ms: 86_400_000 },
  { value: "7d", label: "7 дней", ms: 7 * 86_400_000 },
  { value: "30d", label: "30 дней", ms: 30 * 86_400_000 },
  { value: "never", label: "Бессрочно", ms: null },
] as const;

type TTokenExpiry = (typeof TOKEN_EXPIRY_OPTIONS)[number]["value"];

/** Момент истечения токена; бессрочный — `undefined`. */
export const tokenExpiresAt = (
  expiry: TTokenExpiry,
  now = Date.now(),
): string | undefined => {
  const ms = TOKEN_EXPIRY_OPTIONS.find(option => option.value === expiry)?.ms;

  return ms ? new Date(now + ms).toISOString() : undefined;
};

/** Состояние токена регистрации. */
export type TEnrollmentTokenState = "active" | "revoked" | "expired" | "used";

export const enrollmentTokenState = (
  token: Pick<
    AgentEnrollmentTokenDto,
    "revokedAt" | "expiresAt" | "maxUses" | "uses"
  >,
  now = Date.now(),
): TEnrollmentTokenState => {
  if (token.revokedAt) return "revoked";
  if (token.expiresAt && Date.parse(token.expiresAt) <= now) return "expired";
  if (token.maxUses !== null && token.uses >= token.maxUses) return "used";

  return "active";
};

/** Список через запятую, пробел или перевод строки. */
export const splitList = (text: string): string[] =>
  text
    .split(/[\s,]+/)
    .map(item => item.trim())
    .filter(Boolean);

/**
 * Пары «ключ=значение» через запятую или с новой строки; ключ без значения —
 * пустое значение. Ключ с пробелом внутри — ошибка с текстом пары.
 */
export const parsePairs = (
  text: string,
): { pairs: Record<string, string> } | { error: string } => {
  const pairs: Record<string, string> = {};

  for (const raw of text.split(/[,\n]+/)) {
    const item = raw.trim();

    if (!item) continue;

    const eq = item.indexOf("=");
    const key = (eq === -1 ? item : item.slice(0, eq)).trim();

    if (!key || /\s/.test(key)) return { error: item };
    pairs[key] = eq === -1 ? "" : item.slice(eq + 1).trim();
  }

  return { pairs };
};

const pairsSchema = z.string().transform((text, ctx) => {
  const parsed = parsePairs(text);

  if ("error" in parsed) {
    ctx.addIssue({
      code: "custom",
      message: `Не понимаю «${parsed.error}»: нужно ключ=значение.`,
    });

    return z.NEVER;
  }

  return Object.keys(parsed.pairs).length ? parsed.pairs : undefined;
});

export const enrollmentTokenSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Введите название.")
    .max(100, "Не длиннее 100 символов."),
  expiry: z.enum(["1h", "1d", "7d", "30d", "never"]),
  singleUse: z.boolean(),
  labels: pairsSchema,
});

export type TEnrollmentTokenForm = z.input<typeof enrollmentTokenSchema>;
export type TEnrollmentTokenValues = z.output<typeof enrollmentTokenSchema>;

export const TOKEN_DEFAULTS: TEnrollmentTokenForm = {
  name: "",
  expiry: "1d",
  singleUse: true,
  labels: "",
};

const listSchema = (maxLength: number) =>
  z
    .string()
    .transform(splitList)
    .pipe(
      z.array(z.string().max(maxLength, `Не длиннее ${maxLength} символов.`)),
    )
    .transform(items => (items.length ? items : undefined));

export const KILL_MODE_OPTIONS = [
  { value: "default" as const, label: "Как в службе" },
  { value: "process" as const, label: "Только агент" },
  { value: "mixed" as const, label: "Агент и воркеры" },
];

export const installCommandSchema = z
  .object({
    token: optionalTextSchema(500),
    tokenFile: optionalTextSchema(500),
    name: optionalTextSchema(128),
    baseUrl: optionalTextSchema(500).pipe(
      z.url("Адрес вида https://example.com.").optional(),
    ),
    user: optionalTextSchema(64),
    workers: z.array(workerNameSchema),
    privileged: z.boolean(),
    stopTimeout: optionalTextSchema(20).pipe(
      z
        .string()
        .regex(/^\d+(ms|s|m|h)$/, "Например 30s или 2m.")
        .optional(),
    ),
    config: optionalTextSchema(500),
    killMode: z.enum(["default", "process", "mixed"]),
    packages: listSchema(100),
    rwPaths: listSchema(500),
    sysctl: pairsSchema,
    caFile: optionalTextSchema(500),
    releases: optionalTextSchema(500),
  })
  .refine(form => !!form.token !== !!form.tokenFile, {
    message: "Укажите токен или путь к файлу с токеном — что-то одно.",
    path: ["token"],
  });

export type TInstallCommandForm = z.input<typeof installCommandSchema>;
export type TInstallCommandValues = z.output<typeof installCommandSchema>;

export const INSTALL_DEFAULTS: TInstallCommandForm = {
  token: "",
  tokenFile: "",
  name: "",
  baseUrl: "",
  user: "",
  workers: [],
  privileged: false,
  stopTimeout: "",
  config: "",
  killMode: "default",
  packages: "",
  rwPaths: "",
  sysctl: "",
  caFile: "",
  releases: "",
};

/** Тело запроса команды: пустое не отправляется, режим службы — по выбору. */
export const installCommandBody = ({
  killMode,
  ...values
}: TInstallCommandValues) => ({
  ...values,
  workers: values.workers.length ? values.workers : undefined,
  privileged: values.privileged || undefined,
  killMode: killMode === "default" ? undefined : killMode,
});

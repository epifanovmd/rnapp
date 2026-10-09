import { z } from "zod";

/** Имя воркера: как в пути API. */
const WORKER_NAME = /^[a-z][a-z0-9-]{0,31}$/;

const workersSchema = z.array(
  z.string().regex(WORKER_NAME, "Неверное имя воркера."),
);

const urlField = z
  .url("Полный адрес, например https://api.example.com")
  .or(z.literal(""));

/** Как войти по SSH: паролем или ключом. */
export const SSH_AUTH_OPTIONS = [
  { value: "password" as const, label: "Пароль" },
  { value: "key" as const, label: "Ключ" },
];

/** Срок одноразового токена по умолчанию — сутки. */
export const DEFAULT_EXPIRES_MINUTES = 1440;

/** Команда установки: срок токена, адрес сервера, воркеры. */
export const installCommandSchema = z.object({
  expiresInMinutes: z
    .number("Укажите срок.")
    .int()
    .min(5, "Не меньше 5 минут.")
    .max(43_200, "Не больше 30 дней."),
  baseUrl: urlField,
  workers: workersSchema,
});

export type TInstallCommandForm = z.input<typeof installCommandSchema>;
export type TInstallCommandValues = z.output<typeof installCommandSchema>;

/** Вход по SSH и параметры установки или удаления. */
export const sshSchema = z
  .object({
    host: z.string().trim().max(255),
    port: z.number("Укажите порт.").int().min(1).max(65_535),
    username: z.string().trim().min(1, "Укажите пользователя.").max(64),
    auth: z.enum(["password", "key"]),
    password: z.string(),
    privateKey: z.string().trim(),
    passphrase: z.string(),
    sudo: z.boolean(),
    backendUrl: urlField,
    workers: workersSchema,
    purge: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.auth === "password" && !data.password) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Введите пароль.",
      });
    }
    if (data.auth === "key" && !data.privateKey) {
      ctx.addIssue({
        code: "custom",
        path: ["privateKey"],
        message: "Вставьте приватный ключ.",
      });
    }
  });

export type TSshForm = z.input<typeof sshSchema>;
export type TSshValues = z.output<typeof sshSchema>;

/** Пустая форма SSH для узла: адрес узла, root, вход паролем, все воркеры. */
export const sshDefaults = (
  host: string | null,
  workers: string[],
): TSshForm => ({
  host: host ?? "",
  port: 22,
  username: "root",
  auth: "password",
  password: "",
  privateKey: "",
  passphrase: "",
  sudo: true,
  backendUrl: "",
  workers,
  purge: false,
});

/** Тело запроса по SSH: пустые поля не отправляются — сервер берёт свои. */
export const sshBody = (data: TSshValues) => ({
  host: data.host || undefined,
  port: data.port,
  username: data.username,
  ...(data.auth === "password"
    ? { password: data.password }
    : {
        privateKey: data.privateKey,
        passphrase: data.passphrase || undefined,
      }),
  // root работает без sudo; для остальных — как выбрано.
  sudo: data.username === "root" ? undefined : data.sudo,
  backendUrl: data.backendUrl || undefined,
});

/** Выбранные воркеры для запроса: ничего не выбрано — решает сервер. */
export const workersBody = (workers: string[]): string[] | undefined =>
  workers.length ? workers : undefined;

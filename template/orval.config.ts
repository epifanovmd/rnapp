import { defineConfig, Options } from "orval";

const GEN_ROOT = "./src/shared/api/gen";
const API_ROOT = "./src/shared/api";

/**
 * Один бэкенд = один orval-проект. Код кладётся в `gen/<name>/`, запросы идут
 * через мутатор `<name>Mutator` из `src/shared/api/<name>/<name>.mutator.ts`,
 * который зовёт HTTP-клиент этого бэкенда из DI.
 */
const defineApi = (name: string, input: Options["input"]): Options => ({
  output: {
    tsconfig: "tsconfig.json",
    mode: "single",
    target: `${GEN_ROOT}/${name}/api.ts`,
    schemas: `${GEN_ROOT}/${name}/model`,
    client: "axios",
    clean: [`${GEN_ROOT}/${name}`],
    override: {
      mutator: {
        path: `${API_ROOT}/${name}/${name}.mutator.ts`,
        name: `${name}Mutator`,
      },
      header: false,
    },
  },
  input,
  hooks: {
    // eslint не запускаем: gen/** — в eslint.config.mjs global ignore,
    // ESLint 9 падает с ошибкой, если явно передать полностью игнорируемый путь.
    afterAllFilesWrite: ["prettier --parser typescript --write"],
  },
});

/** Локальный файл спеки для генерации без сети: `MAIN_SWAGGER=./swagger.json npm run generate:orval`. */
const MAIN_SWAGGER =
  process.env.MAIN_SWAGGER ??
  "http://147.45.245.104:8181/api-docs/swagger.json";

export default defineConfig({
  main: defineApi("main", {
    target: MAIN_SWAGGER,
    override: {
      // В swagger-спеке GET /api/chat/{chatId}/message/search и GET /api/message/search
      // делят один operationId "SearchMessages" — orval сгенерировал бы два
      // одноимённых экспорта. Разводим их до генерации.
      transformer: spec => {
        const op = spec.paths?.["/api/chat/{chatId}/message/search"]?.get;

        if (op?.operationId === "SearchMessages") {
          op.operationId = "SearchChatMessages";
        }

        return spec;
      },
    },
  }),
});

import { defineConfig } from "orval";

export default defineConfig({
  rnapp: {
    output: {
      tsconfig: "tsconfig.json",
      mode: "single",
      target: "./src/shared/api/gen/api.ts",
      schemas: "./src/shared/api/gen/model",
      client: "axios",
      clean: ["./src/shared/api/gen"],
      override: {
        mutator: {
          path: "./src/shared/api/http-client.ts",
          name: "axiosInstance",
        },
        header: false,
      },
    },
    input: {
      target: "http://147.45.245.104:8181/api-docs/swagger.json",
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
    },
    hooks: {
      // eslint не запускаем: src/api/gen/** — в eslint.config.mjs global ignore,
      // ESLint 9 падает с ошибкой, если явно передать полностью игнорируемый путь.
      afterAllFilesWrite: ["prettier --parser typescript --write"],
    },
  },
});

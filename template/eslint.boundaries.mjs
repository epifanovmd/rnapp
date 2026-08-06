import boundaries from "eslint-plugin-boundaries";

/**
 * ESLint-конфигурация для eslint-plugin-boundaries — Feature-Sliced Design.
 *
 * Слои снизу вверх (нижний не знает про вышестоящие):
 *
 *   1. shared    — переиспользуемый код без знания о бизнес-логике (ui/api/config/lib).
 *   2. entities  — бизнес-сущности (auth, user): стор + доменные модели, без UI-форм.
 *   3. features  — юзкейсы (sign-in, biometric, ...): интерактивные сценарии поверх entities.
 *   4. widgets   — крупные самостоятельные блоки UI (chat-room, app-shell).
 *   5. pages     — экраны, тонкая композиция widgets/features/entities под конкретный роут.
 *   6. app       — композиционный корень (App.tsx, App.navigator.tsx, app.module.ts) — видит всё.
 *
 * Правило FSD: "a module in a slice can only import other slices when they are
 * located on layers strictly below" — модуль слайса может импортировать только
 * слайсы строго нижних слоёв. Слайсы одного слоя друг друга не видят
 * (entities/auth не видит entities/user, features/sign-in не видит features/sign-up
 * и т.д.) — если нужно сослаться на другой слайс того же слоя, это повод
 * пересмотреть границы, а не пробить дыру в правилах.
 *
 * `policies` — список правил "from → allow to"; `default: "disallow"` означает,
 * что всё не перечисленное явно запрещено.
 */

export const boundariesConfig = {
  files: ["**/*.{ts,tsx}"],
  plugins: { boundaries },
  settings: {
    "import/resolver": {
      typescript: { project: "./tsconfig.json" },
    },

    "boundaries/elements": [
      { type: "shared", pattern: "src/shared/**" },
      { type: "entities", pattern: "src/entities/*/**", capture: ["slice"] },
      { type: "features", pattern: "src/features/*/**", capture: ["slice"] },
      { type: "widgets", pattern: "src/widgets/*/**", capture: ["slice"] },
      // pages сгруппированы по навигаторам: src/pages/{tabs,stack}/<slice>/
      { type: "pages", pattern: "src/pages/*/*/**", capture: ["group", "slice"] },
      { type: "app", pattern: "src/app/**" },
    ],
  },
  rules: {
    "boundaries/dependencies": [
      "error",
      {
        default: "disallow",
        policies: [
          // --- 1. shared: не знает ни про что бизнесовое -------------------
          {
            from: { element: { type: "shared" } },
            allow: { to: { element: { type: "shared" } } },
          },

          // --- 2. entities: только shared, никогда другую entity -----------
          {
            from: { element: { type: "entities" } },
            allow: [
              { element: { type: "shared" } },
              {
                element: {
                  type: "entities",
                  captured: { slice: "{{from.element.captured.slice}}" },
                },
              },
            ],
            message:
              "entities не может импортировать другую entity напрямую — используй контракт (Dependency Inversion)",
          },

          // --- 3. features: shared + entities, никогда другую feature ------
          {
            from: { element: { type: "features" } },
            allow: [
              { element: { type: ["shared", "entities"] } },
              {
                element: {
                  type: "features",
                  captured: { slice: "{{from.element.captured.slice}}" },
                },
              },
            ],
            message:
              "features не может импортировать другую feature напрямую",
          },

          // --- 4. widgets: shared + entities + features --------------------
          {
            from: { element: { type: "widgets" } },
            allow: [
              { element: { type: ["shared", "entities", "features"] } },
              {
                element: {
                  type: "widgets",
                  captured: { slice: "{{from.element.captured.slice}}" },
                },
              },
            ],
          },

          // --- 5. pages: всё нижестоящее, свой же слайс — можно -------------
          {
            from: { element: { type: "pages" } },
            allow: [
              { element: { type: ["shared", "entities", "features", "widgets"] } },
              {
                element: {
                  type: "pages",
                  captured: {
                    group: "{{from.element.captured.group}}",
                    slice: "{{from.element.captured.slice}}",
                  },
                },
              },
            ],
            message: "pages не может импортировать другую page напрямую",
          },

          // --- 6. app: композиционный корень, видит всё ---------------------
          {
            from: { element: { type: "app" } },
            allow: {
              element: {
                type: ["shared", "entities", "features", "widgets", "pages", "app"],
              },
            },
          },
        ],
      },
    ],
  },
};

export default boundariesConfig;

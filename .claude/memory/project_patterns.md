---
name: Code Patterns & Conventions
description: Паттерны — entity store, feature-хук, страница, compound component, форма (примеры в коде)
type: project
---

Живые примеры важнее описаний — паттерн = файл, где он реализован:

| Паттерн | Где смотреть |
|---|---|
| Entity store (DI + MobX) | `entities/auth/model/{types,store}.ts` + `auth.module.ts` |
| Feature-хук | `features/sign-in/model/useSignInVM.ts` (+ `validation.ts`) |
| Страница | `pages/sign-in/SignIn.tsx` → регистрация в `App.screens.ts` |
| Compound via slots | `shared/ui/navbar/Navbar.tsx` (`createSlot` + `useSlotProps`) |
| Форма (RHF + Zod) | `useForm({ resolver: zodResolver(schema) })`; schema в `model/validation.ts` |

Ключевые правила:
- Store: `createInjectDecorator<T>()` → `<slice>.module.ts` (`ContainerModule`) → регистрация в
  `app/app.module.ts`; потребление `IXxx.useInstance()` / `IXxx.getInstance()`.
- Общая логика двух слайсов одного слоя — слоем ниже (`loginValidation` в `entities/auth`).
- Async-state — через холдеры `shared/lib/holders/`, не руками.
- `shared/api/gen/` не редактировать; стили через `useTheme`/`useThemeAwareObject`.
- Внутри слайса/сегмента — только относительные импорты (self-alias запрещён).

---
name: Code Patterns & Conventions
description: Паттерны — entity store, feature-хук, страница, compound component, форма
type: project
---

| Паттерн | Где смотреть |
|---|---|
| Entity store (DI + MobX) | `entities/auth/model/{types,store}.ts` + `auth.module.ts` |
| Feature-хук | `features/sign-in/model/useSignInVM.ts` (+ `validation.ts`) |
| Страница | `pages/sign-in/SignIn.tsx` → регистрация в `App.screens.ts` |
| Compound via slots | `shared/ui/navbar/Navbar.tsx` (`createSlot` + `useSlotProps`) |
| Форма (RHF + Zod) | `useForm({ resolver: zodResolver(schema) })`; schema в `model/validation.ts` |

Правила:
- Store: `createInjectDecorator<T>()` → `<slice>.module.ts` → `app/app.module.ts`.
  Потребление: `IXxx.useInstance()` / `IXxx.getInstance()`.
- Общая логика слайсов одного слоя — слоем ниже (`loginValidation` в `entities/auth`).
- Async-state — через холдеры `shared/lib/holders/`.
- `shared/api/gen/` не редактировать.
- Стили: `useTheme`/`useThemeAwareObject`.
- Внутри слайса/сегмента — только относительные импорты.

---
id: tech/recipes
title: Рецепты модулей
summary: Эталоны в коде — entity-стор, feature с VM-хуком и формой, экран и его регистрация, compound на слотах, стили темы, сценарии действий.
layer: project
roles: [developer]
stages: [implementation]
depends_on: [architecture/placement, architecture/state, architecture/di]
---

# Рецепты модулей

Новый модуль — по эталону и с README по
[шаблону](../00-meta/templates/module-readme.md).

| Что                                  | Эталон                                                          |
| ------------------------------------ | --------------------------------------------------------------- |
| entity-стор (DI + MobX + холдер)     | `entities/auth/model/{types,store}.ts` + `auth.module.ts`       |
| feature: VM-хук, валидация, форма    | `features/sign-in/model/useSignInVM.ts` + `model/validation.ts` |
| экран и его регистрация              | `pages/stack/sign-in` → `app/App.screens.ts`                    |
| вкладка                              | `pages/tabs/settings` → `app/app-tab-screens.tsx`               |
| compound на слотах                   | `shared/ui/navbar` (`slot.of` + `createCompound`)               |
| многоуровневые слоты, инъекция props | `shared/ui/bottom-sheet`                                        |
| сценарий действия над записью        | `features/delete-file` (`useDeleteFile`)                        |

## Правила рецептов

- Стор: `createInjectDecorator<T>()` → `<slice>.module.ts` → `app/app.module.ts`;
  потребление — `IXxx.useInstance()` / `IXxx.getInstance()`.
- Форма — `useForm({ resolver: zodResolver(schema) })`, схема — `model/validation.ts`;
  общие правила домена — в сущности (`loginValidation` в `entities/auth`).
- Сценарий «подтвердить → запрос → уведомление» — в feature; экран его только
  вызывает (`useDeleteFile`: confirm → стор → `notifyApiError`, возвращает результат).
- Экран: параметры — рядом с экраном через `ScreenProps<Params>`; регистрация — в
  static-конфиге навигатора ([architecture/navigation](../20-architecture/navigation.md)).
- Стили: `useTheme`; тем-зависимые стили — `makeThemeStyles` (фабрика уровня модуля,
  кэш по имени темы).
- Ошибка подгрузки списка (`isLoadMoreError` у Infinite/Cursor холдеров) — кнопка
  «повторить» в `ListFooterComponent`: `onEndReached` сам повторно не сработает.
- Реалтайм — в сущностях, экраны сокет не трогают
  ([domain/screens](../60-domain/screens.md#жизненный-цикл)).
- `extraData` списков — стабильный ключ, а не объект VM: новый объект на рендер
  перерисовывает все ячейки.

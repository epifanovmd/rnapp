---
id: conventions/naming
title: Именование директорий и файлов
summary: kebab-case директорий, таблица имён файлов (компоненты, хуки, store, validation, module, contract), запрещённые сегменты.
layer: stack
roles: [developer, reviewer]
stages: [implementation, review]
depends_on: [architecture/fsd-layers]
---

# Именование директорий и файлов

Проверяется `eslint-plugin-check-file` (`eslint.naming.mjs`).

## Директории

`kebab-case`. Имя слайса — предметная область (`<domain-noun>`) или пользовательское
действие (`<user-action>`); имя сегмента — назначение кода.

Новые сегменты `components/`, `hooks/`, `types/`, `utils/` не создаются. Стандартные:
`ui`, `model`, `api`, `lib`, `config`; другое имя — если выражает устойчивую
ответственность. Группы навигаторов и служебные каталоги фреймворка — по его
требованиям.

## Файлы

Регистр имени задаёт `eslint.naming.mjs` по трём правилам: имя на `use|create|build` +
заглавную букву — camelCase и совпадает с экспортом (`use<Name>VM.ts`,
`create<Thing>.tsx`); прочие `.tsx` — PascalCase; прочие `.ts` — kebab-case. Средние
расширения (`.test`, `.types`) не учитываются, поэтому тест компонента —
`ComponentName.test.tsx`, тест модуля — `module-name.test.ts`.

| Содержимое                      | Соглашение                            | Пример                             |
| ------------------------------- | ------------------------------------- | ---------------------------------- |
| React-компонент                 | `PascalCase.tsx`                      | `<Component>.tsx`                  |
| React-хук с основным экспортом  | имя файла = имя экспорта              | `use<Feature>VM.ts`                |
| shared utility hook             | принятый в модуле `use-kebab-case.ts` | `use-latest-ref.ts`                |
| обычный TypeScript-модуль       | `kebab-case.ts`                       | `<purpose>-<thing>.ts`             |
| store в доменном слайсе         | `store.ts`                            | `entities/<entity>/model/store.ts` |
| валидация                       | `validation.ts`                       | `model/validation.ts`              |
| константы одного модуля         | `constants.ts`                        | `model/constants.ts`               |
| типы небольшого сегмента        | `types.ts`                            | `model/types.ts`                   |
| типы одного крупного компонента | `<name>.types.ts`                     | `<component>.types.ts`             |
| DI-регистрация                  | `<slice>.module.ts`                   | `<slice>.module.ts`                |
| public API                      | `index.ts`                            | `<layer>/<slice>/index.ts`         |
| контракт Dependency Inversion   | `<name>.contract.ts`                  | `<name>.contract.ts`               |
| тест                            | имя по тем же правилам + `.test`      | `__tests__/<Component>.test.tsx`   |
| документация модуля             | `README.md` в корне модуля            | `features/<feature>/README.md`     |

- Имя не повторяет контекст: внутри `entities/<entity>/model` — `store.ts`, а не
  `<entity>-store.ts`.
- `.tsx` без компонента всё равно называется по основному экспорту; JSX не повод
  складывать несвязанные декларации в один файл.
- Имена codegen-спек нативных модулей и платформенных файлов задаёт генератор или
  платформа; исключение зафиксировано в конфигурации линтера.

## Имена в коде

- функция — глагол; boolean — вопрос: `isLoading`, `canEdit`, `hasAccess`;
- коллекция — множественное число;
- имя выражает предметный смысл, избегать `data`, `manager`, `helper`, `common`,
  если ответственность можно уточнить.

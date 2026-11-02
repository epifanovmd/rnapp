---
name: new-module
description: Создание нового модуля — слайса pages/widgets/features/entities или shared-модуля — в правильном слое по правилам размещения, с public API, DI-регистрацией и README. Применять, когда задаче нужен новый слайс или модуль.
argument-hint: "[что за модуль и зачем]"
---

# Новый модуль

1. Слой и имя — по [placement](../../../docs/20-architecture/placement.md) и
   [naming](../../../docs/30-conventions/naming.md). Неоднозначно — спросить.
2. Проверить, нет ли уже подходящего модуля: [docs/modules.md](../../../docs/modules.md).
3. Структура — по [recipes](../../../docs/50-tech/recipes.md): `index.ts` (public API),
   сегменты только нужные, без `components/hooks/types/utils`.
4. DI — `<slice>.module.ts` и регистрация в композиционном корне
   ([architecture/di](../../../docs/20-architecture/di.md)), если есть биндинги.
5. `README.md` по [шаблону](../../../docs/00-meta/templates/module-readme.md).
6. Экран — регистрация и пункт навигации по эталону
   [recipes](../../../docs/50-tech/recipes.md).
7. `yarn docs:index` и быстрая проверка ([ops/commands](../../../docs/70-ops/commands.md)).

Модуль: $ARGUMENTS

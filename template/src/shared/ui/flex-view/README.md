# flex-view

Утилитарные layout-пропсы поверх style: вместо `style={{ flexDirection: "row", padding: 16 }}` —
`<Row pa={16}>`. Через `useFlexProps` проходят все UI-примитивы (`FlexView`/`Col`/`Row`, `Text`,
`Touchable`, `Image`, `Icon`, `ScrollView`, `Container`), поэтому конвертация выполняется на каждом
рендере каждого элемента и написана без промежуточных аллокаций: статичные lookup-карты, один проход
по пропсам, без `useMemo`/`StyleSheet.create`.

## Применение

```tsx
<Col flex bg="surface" pa={16} radius={12}>
  <Row alignItems="center" gap={8}>
    <Icon name="settings" />
    <Text textStyle="Title_L" color="textPrimary">Заголовок</Text>
  </Row>
</Col>
```

- **Компоненты**: `FlexView` (обычный `View`), `Col` / `Row` (то же + `flexDirection`).
  Все — `memo` + `forwardRef<View>`, принимают `FlexProps & ViewProps`.
- **Хуки**: `useFlexProps(props, defaultProps?)` — view-пропсы;
  `useTextFlexProps(props, defaultProps?)` — то же + текстовые пропсы (`color`, `fontSize`,
  `lineHeight`, …). Оба возвращают `{ style, ownProps }`: всё, что распознано картой, уходит в
  `style`, остальное — в `ownProps` (спредится на нативный компонент).
- **HOC**: `FlexView.createFlexViewComponent(Component)` — оборачивает произвольный компонент,
  принимающий `style`.

### Виды пропсов

| Вид | Примеры | Поведение |
|---|---|---|
| Алиасы | `pa pv ph pl…`, `ma mv mh ml…`, `radius`, `bg` | прямое переименование в style-ключ |
| Мульти-ключи | `topRadius`, `leftRadius`, `centerContent` | одно значение в несколько ключей |
| Boolean-шорткаты | `flex`, `flexGrow`, `flexShrink` → `1`; `width`, `height` → `"100%"`; `left/right/top/bottom` → `0`; `row/col`, `wrap`, `absolute`, `centerContent` | `<Col flex />` ≡ `flex={1}` |
| Цвета темы | `bg`, `color`, `borderColor`, `textDecorationColor` | `keyof TColorTheme` резолвится через тему (`bg="surface"`), иначе значение как есть |
| Специальные | `circle` (диаметр), `absoluteFill`, `elevation` (тень iOS/Android), `rotate/translateX/translateY/scale` (накапливаются в `transform`) | явные ветки в конвертере |
| `debug` | `true` — красный фон; строка — лог в консоль при рендере (только `__DEV__`) | |

Порядок применения: `defaultProps` → пропсы компонента → `style`-проп (`StyleSheet.flatten`,
перекрывает всё). `undefined`-значения пропускаются. Текстовые пропсы работают только в
компонентах на `useTextFlexProps`; во view-компонентах они уйдут в `ownProps`.

## Устройство

| Файл | Содержимое |
|---|---|
| `types.ts` | `FlexProps<TStyleSource>` — типы всех пропсов; текстовые подключаются только при `TStyleSource = TextStyle` |
| `utils/flex-props-map.ts` | `viewStyleKeysMap` / `textStyleKeysMap` (проп → style-ключи), `flexBooleanValuesMap` (значения boolean-шорткатов), `themeColorFlexPropsSet`, `transformFlexPropsSet` |
| `utils/flex-props-converter.ts` | однопроходный конвертер: карта → style, спец-ветки, остальное → `ownProps` |
| `utils/shadow-style.ts` | `elevation` → платформенная тень |
| `hooks/useFlexProps.ts`, `hooks/useTextFlexProps.ts` | привязка к теме, вызов конвертера |

## Добавление нового пропса

Всегда два шага: тип в `types.ts` + маппинг в `flex-props-map.ts`. Забыть второй нельзя —
типовая проверка `LostFlexPropsKeys` (`const CheckError` в конце `flex-props-map.ts`) уронит
`tsc`, если проп есть в типах, но не покрыт картой или списком `SpecialFlexPropKeys`.

1. **Простой проп / алиас**: поле в подходящую группу `types.ts`, запись в `viewStyleKeysMap`:
   `bsw: ["borderStartWidth"]`. Несколько ключей в массиве — значение размножится.
2. **Boolean-шорткат**: тип с `| true` + подставляемое значение в `flexBooleanValuesMap`
   (без записи в style уйдёт сам boolean).
3. **Цвет темы**: тип `keyof TColorTheme | ColorValue` + имя пропа в `themeColorFlexPropsSet`.
4. **Текстовый проп**: то же, но запись в `textStyleKeysMap` (ниже спреда `...viewStyleKeysMap`)
   и тип в `TextProps`.
5. **Нетривиальная трансформация** (одно значение → несколько вычисляемых ключей): явная ветка
   `else if (key === "...")` в конвертере рядом с `circle`/`elevation` + имя пропа в тип
   `SpecialFlexPropKeys`. Новые transform-пропсы — в `transformFlexPropsSet` +
   `SpecialFlexPropKeys`, ветка общая.

Проверка: `npx tsc --noEmit` из `template/` — ловит рассинхрон типов с картой и опечатки в
style-ключах (карты типизированы `satisfies Record<string, readonly (keyof FlexStyle)[]>`).

Не добавлять в горячий путь конвертера аллокации и функции-трансформеры на проп — только
lookup-карты и явные ветки.

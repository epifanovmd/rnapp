# Compound slots

Schema-driven compound components. A slot marker is tagged with owner metadata
once; children are resolved in a single `O(children)` pass. Names and
`displayName` never participate in runtime matching.

## Modules

- `slot.types.ts` — public contracts and inferred compound types.
- `slot.ts` — declaration: `slot<P>()` (no component) and `slot.of(Component)`.
- `slot-entries.ts` — schema compiled once into runtime entries.
- `slot-markers.ts` — markers, owner identity, inherited statics of a nested
  compound.
- `slot-handle.ts` — slot handles and the prop fold that renders a slot.
- `slot-merge.ts` — merge policies (`compose` by default, `replace`).
- `slot-meta.ts` — symbols, prepared entry shape, owner matching.
- `slot-validate.ts` — assertions, called only under `__DEV__`.
- `resolve-children.ts` / `resolve-object.ts` — JSX and object strategies.
- `create-compound.ts` — composition root.

The root render function is **called**, not mounted as an element, so a compound
costs exactly one fiber — the same as a hand-written component. Traversal does
not use `React.Children` (that path allocates a result array and builds a string
key per child), empty nodes are dropped instead of becoming `null` content, slot
handles are class instances, and the handle of an absent slot is created once per
schema and reused.

## Definition

```tsx
const cardSlots = {
  title: slot.of(Title, { defaultProps: { size: "s" } }),
  // рендерится даже если потребитель слот не объявил
  body: slot.of(Body, { always: true }),
  action: slot.of(Action, { multiple: true }),
  // слот без компонента: рендерится собственное содержимое
  raw: slot<{ id?: string }>(),
};

// третий параметр — тип ref, по умолчанию `never`: у compound без ref его не пишут
const CardRoot = ({
  props,
  slots,
  content,
}: CompoundRootProps<CardProps, typeof cardSlots, View>) => (
  <View {...props}>
    {slots.title.render({ defaults: { text: props.title } })}
    {slots.body.render({ defaults: { children: content } })}
    {slots.action.renderAll({ separator: <Gap /> })}
  </View>
);

export const Card = createCompound<CardProps, View>()({
  name: "Card",
  render: CardRoot,
  slots: cardSlots,
});
```

## Props flow

`render()` folds four layers, each next one wins, through the slot's merge
policy (`mergeSlotProps.compose` by default: `style` is concatenated, `on*`
handlers are called both, everything else is overwritten):

```
definition.defaultProps → render({ defaults }) → props потребителя → render({ inject })
```

`defaults` are the owner's suggestions, `inject` is what the owner requires —
measurement callbacks, computed styles, ref-driven handlers. Injection reaches
custom content too: `children` may be a render function and receives the merged
props.

```tsx
// владелец
const CardRoot = ({ slots }) => (
  <View>{slots.footer.render({ inject: { onLayout: onFooterLayout } })}</View>
);

// потребитель: свой рендер получает те же слитые props
<Card.Footer>{({ onLayout }) => <MyFooter onLayout={onLayout} />}</Card.Footer>;
```

## Nested compounds

A slot whose `component` is itself a compound inherits its statics, so
`Card.Footer.PrimaryButton` exists without manual assembly, and the object mode
nests through the child's own `slots` prop:

```tsx
const cardSlots = { footer: slot.of(CardFooter) };

<Card.Footer>
  <Card.Footer.PrimaryButton title={"Ок"} />
</Card.Footer>;

<Card slots={{ footer: { slots: { primaryButton: { title: "Ок" } } } }} />;
```

## JSX and object modes

Modes combine: `slots` is the base, JSX markers override it per slot. JSX mode
supports slots inside fragments. A slot is owned by exactly one compound; foreign
slots, duplicate single slots and missing required slots fail with explicit
errors in dev.

# Compound slots

`slots` is a schema-driven compound-component foundation. Every slot marker is
tagged with owner metadata once, then children are resolved in one `O(children)`
pass. Names and `displayName` never participate in runtime matching.

## Modules

- `slot.types.ts` — public contracts and inferred compound types.
- `slots.ts` — public runtime: `slot`, `createCompound`, `isSlotElement`.
- `slot-runtime.ts` — shared internals: owner metadata, prepared schema entries,
  child traversal, slot handles, `mergeSlotProps`.
- `resolve-children.ts` — JSX strategy (slot discovery among children).
- `resolve-object.ts` — object strategy (values from the `slots` prop).
- `index.ts` — public API only.

Both strategies return the same `{ contentItems, values }`; handles and required
checks are shared. Traversal does not use `React.Children` — that path allocates
a result array and builds a string key per child. Empty nodes (`null`,
`undefined`, booleans) are dropped instead of becoming `null` content items, so
`contentItems.length` reflects real content. Slot handles are class instances
(no closure per slot per render) and the handle of an absent slot is created once
per schema and reused.

## Definition

```tsx
const cardSlots = {
  title: slot<TitleProps>({ component: Title }),
  action: slot<ActionProps>({ component: Action, multiple: true }),
};

const CardRoot = ({ props, slots, content }: CompoundRootProps<
  CardProps,
  View,
  typeof cardSlots
>) => (
  <View {...props}>
    {slots.title.render({ defaultProps: { text: "Untitled" } })}
    {content}
    {slots.action.renderAll()}
  </View>
);

export const Card = createCompound<CardProps, View>()({
  name: "Card",
  render: CardRoot,
  slots: cardSlots,
});
```

## JSX and object modes

```tsx
<Card>
  <Card.Title text="Profile" />
  <Card.Action id="edit" />
  <Card.Action id="remove" />
</Card>

<Card
  slots={{
    title: { text: "Profile" },
    action: [{ key: "edit", props: { id: "edit" } }],
  }}
/>
```

JSX mode supports slots inside fragments. Object mode skips slot discovery and
treats every React child as regular content. A slot is owned by exactly one
compound component; foreign slots, duplicate single slots and missing required
slots fail with explicit errors.

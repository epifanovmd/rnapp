---
name: Code Patterns & Conventions
description: Реальные паттерны — создание entity store, feature-хука, страницы, compound component, форм
type: project
---

## Creating a new entity store (`entities/<name>/`)

Real shape, modeled on `entities/auth/model/{types.ts,store.ts}` + `entities/auth/auth.module.ts`:

```ts
// entities/<name>/model/types.ts
import { createInjectDecorator } from "@shared/lib/di";

export const IFeatureStore = createInjectDecorator<IFeatureStore>();

export interface IFeatureStore {
  readonly isLoading: boolean;
  doSomething(): Promise<void>;
}

// entities/<name>/model/store.ts
import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { IApiService } from "@shared/api";
import { IFeatureStore } from "./types";

@injectable()
class FeatureStore implements IFeatureStore {
  isLoading = false;

  constructor(@IApiService() private _api: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async doSomething() {
    this.isLoading = true;
    await this._api.someCall();
    this.isLoading = false;
  }
}
export { FeatureStore };

// entities/<name>/<name>.module.ts
import { ContainerModule } from "inversify";
import { FeatureStore } from "./model/store";
import { IFeatureStore } from "./model/types";

export const featureModule = new ContainerModule(({ bind }) => {
  bind(IFeatureStore.Tid).to(FeatureStore).inSingletonScope();
});
```

Then register `featureModule` in `src/app/app.module.ts`'s `registerContainerModules()`
(`iocContainer.load(...)`). Consume with `const store = IFeatureStore.useInstance();` inside a component,
or `IFeatureStore.getInstance()` outside React.

If you need paginated/async list state instead of ad-hoc fields, reach for a holder
(`@shared/lib/holders`: `EntityHolder`, `PagedHolder`, `InfiniteHolder`, `CollectionHolder`,
`MutationHolder`, `PollingHolder`, `CursorHolder`, `FilterHolder`, ...) rather than hand-rolling
loading/error/data state.

## Creating a feature hook (`features/<name>/model/use<Xxx>VM.ts`)

Real shape, modeled on `features/sign-in/model/useSignInVM.ts`: a plain hook (not a class/store) that
wires an entity store + navigation + a react-hook-form instance into the shape a page needs. No IoC
binding needed for the hook itself — only the entities it depends on are injected.

```ts
// features/<name>/model/use<Xxx>VM.ts
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useCallback } from "react";
import { IFeatureStore } from "@entities/<name>";
import { useNavigation } from "@shared/lib/navigation";
import { xxxFormValidationSchema, TXxxForm } from "./validation";

export const useXxxVM = () => {
  const store = IFeatureStore.useInstance();
  const navigation = useNavigation();

  const form = useForm<TXxxForm>({ resolver: zodResolver(xxxFormValidationSchema) });

  const handleSubmit = useCallback(async () => {
    return form.handleSubmit(async data => { await store.doSomething(data); })();
  }, [form, store]);

  return { form, handleSubmit };
};
```

`validation.ts` sibling file holds the zod schema + inferred type (`TXxxForm`). Shared validation rules
used by more than one feature (e.g. login/password rules shared by `features/sign-in` and
`features/sign-up`) live one layer down, in `entities/auth/model/validation.ts`
(`loginValidation`, `passwordValidation`) — this is the standard way to avoid a same-layer
`features/sign-in` → `features/sign-up` import, which `eslint-plugin-boundaries` forbids.

## Creating a page (`pages/<name>/`)

1. Create the screen component under `src/pages/<slice>/` (real screen) or
   `src/pages/ui-kit-demo/` (playground/demo screen).
2. Register it in `src/app/App.screens.ts` (`PUBLIC_SCREENS`/`PRIVATE_SCREENS`) or, if it belongs in the
   bottom tab bar, in `src/app/app-tab-screens.tsx`'s `TAB_SCREENS`.
3. Add its param type to `ScreenParamList` in `shared/lib/navigation/navigation.types.ts` if it takes
   route params.
4. `pages/*` may compose `widgets`, `features`, and `entities` freely, but not another `pages/*` slice
   directly (`eslint-plugin-boundaries`).

## Compound components via slots (`@shared/lib/slots`)

Real shape, modeled on `shared/ui/navbar/Navbar.tsx`:

```tsx
import { createSlot, useSlotProps } from "@shared/lib/slots";

const Title = createSlot<{ text: string }>("Title");
const Right = createSlot<ViewProps>("Right");

const MyComponentImpl = ({ children, ...rest }: Props) => {
  // pass the OWNER component (MyComponent), not the slot, as the first arg —
  // useSlotProps looks up MyComponent's own static Title/Right properties.
  const { $children, title, right } = useSlotProps(MyComponent, children);

  return (
    <View {...rest}>
      {title && <Text>{title.text}</Text>}
      {$children}
      {right && <View>{/* render right.children etc. */}</View>}
    </View>
  );
};

export const MyComponent = Object.assign(MyComponentImpl, { Title, Right });
```

Usage: `<MyComponent><MyComponent.Title text="Hi" /><MyComponent.Right>...</MyComponent.Right></MyComponent>`.
Slot matching is by component identity/`displayName`, so slot markers must be assigned as static
properties on the owner component with an uppercase key (`keyIsSlot`).

## Forms (React Hook Form + Zod)

```ts
const schema = z.object({ email: z.string().email() });
type TForm = z.infer<typeof schema>;
const { control, handleSubmit } = useForm<TForm>({ resolver: zodResolver(schema) });
```
`@hookform/resolvers/zod`'s `zodResolver` bridges the two. Validation schemas live next to the hook that
uses them (`features/<name>/model/validation.ts`), except schema fragments shared across features, which
move down to the owning `entities/<name>/model/validation.ts`.

## Rules recap

- **`src/shared/api/gen/`** — auto-generated, NEVER edit by hand. `npm run generate:orval`.
- **Path aliases** required in slice code: `@app`, `@pages`, `@widgets`, `@features`, `@entities`,
  `@shared` (relative imports only within the same segment/slice — see `eslint.config.mjs`'s
  self-import restriction, which forbids e.g. `@shared/ui/*` from inside `shared/ui/**`).
- **Stores** — singletons via IoC, bound in the owning slice's `*.module.ts`, loaded once in
  `app/app.module.ts`.
- **Forms** — React Hook Form + Zod, always via `zodResolver`.
- **Styling** — via `useTheme`/`useThemeAwareObject` (`@shared/lib/theme`), not raw inline color/spacing
  values baked into `StyleSheet.create` where a themed value exists.
- **Navigation** — via `NavigationService` (imperative, outside React) or `useNavigation`/`useRoute`
  hooks (`@shared/lib/navigation`) inside components.
- **No same-layer imports** — a slice never imports a sibling slice in the same layer
  (`eslint-plugin-boundaries`); shared logic moves down one layer instead.

---
name: Code Patterns & Conventions
description: Паттерны создания stores, компонентов, навигации, форм, socket subscriptions
type: project
---

## Создание нового Store

```typescript
import { makeAutoObservable } from "mobx";
import { createServiceDecorator } from "@di";
import { EntityHolder } from "@store/holders";

export const IFeatureStore = createServiceDecorator<FeatureStore>();

@IFeatureStore({ inSingleton: true })
export class FeatureStore {
  private _holder = new EntityHolder<FeatureDto>();

  constructor() {
    makeAutoObservable(this);
  }
}

// Hook:
export const useFeatureStore = iocHook(IFeatureStore);
```

## Compound Component (Slots)

```typescript
import { createSlot, useSlotProps } from "@components/slots";

const Title = createSlot<{ text: string }>("Title");
const MyComponent = ({ children }) => {
  const titleProps = useSlotProps(Title, children);
  return <View>{titleProps && <Text>{titleProps.text}</Text>}</View>;
};
MyComponent.Title = Title;
```

## Навигация (экраны)

1. Создать screen в `src/screens/stack/` или `src/screens/tabs/`
2. Зарегистрировать в `App.screens.ts` (PRIVATE_SCREENS / PUBLIC_SCREENS)
3. Добавить тип в `navigation/navigation.types.ts`

## Forms

React Hook Form + Zod:
```typescript
const schema = z.object({ email: z.string().email() });
const { control, handleSubmit } = useForm({ resolver: zodResolver(schema) });
```

## Правила

- **`src/api/api-gen/`** — auto-generated, NEVER edit. `npm run generate:api`
- **Path aliases** обязательны: `@api`, `@store`, `@components`, `@core`, `@utils`, `@hooks`, `@di`, `@navigation`, `@socket`
- **Stores** — singletons через IoC, `@IStoreService({ inSingleton: true })`
- **Forms** — React Hook Form + Zod
- **Стили** — через theme (useTheme, useThemeAwareObject), НЕ inline styles
- **Navigation** — через NavigationService или React Navigation hooks

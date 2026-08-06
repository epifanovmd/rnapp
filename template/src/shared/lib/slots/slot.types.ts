import type {
  ComponentProps,
  ElementType,
  ForwardedRef,
  ForwardRefExoticComponent,
  FunctionComponent,
  Key,
  MemoExoticComponent,
  PropsWithoutRef,
  ReactNode,
  RefAttributes,
} from "react";

/** Props, с которыми слот отдаётся компоненту или render-функции. */
export type MergedSlotProps<P extends object> = Omit<P, "children"> & {
  children?: ReactNode;
};

/** Политика слияния: props потребителя + инъекция владельца (инъекция приоритетнее). */
export type SlotMergeProps<P extends object> = (
  props: MergedSlotProps<P>,
  inject: Partial<MergedSlotProps<P>>,
) => MergedSlotProps<P>;

export interface SlotOptions<
  P extends object,
  Multiple extends boolean = false,
  Required extends boolean = false,
> {
  /** Слот рендерится даже без объявления потребителем — на defaults и инъекции. */
  always?: boolean;
  component?: ElementType<any>;
  defaultProps?: Partial<MergedSlotProps<P>>;
  mergeProps?: SlotMergeProps<P>;
  multiple?: Multiple;
  required?: Required;
}

/** Опции слота с фантомным полем `__slot`: оно переносит типы в схему. */
export interface SlotDefinition<
  P extends object,
  Multiple extends boolean = false,
  Required extends boolean = false,
  Nested = {},
> extends SlotOptions<P, Multiple, Required> {
  readonly __slot: [P, Multiple, Required, Nested];
}

export type AnySlotDefinition = SlotDefinition<any, boolean, boolean, any>;
export type SlotSchema = Record<string, AnySlotDefinition>;

type SlotOwnProps<D> = D extends {
  __slot: [infer P extends object, boolean, boolean, unknown];
}
  ? P
  : never;

type SlotIsMultiple<D> = D extends {
  __slot: [object, infer Multiple extends boolean, boolean, unknown];
}
  ? Multiple
  : never;

type SlotIsRequired<D> = D extends {
  __slot: [object, boolean, infer Required extends boolean, unknown];
}
  ? Required
  : never;

type SlotNested<D> = D extends {
  __slot: [object, boolean, boolean, infer Nested];
}
  ? Nested
  : {};

/**
 * Props слота: собственные props компонента, где `children` дополнительно может
 * быть render-функцией — она получает уже слитые props владельца.
 */
export type SlotProps<D> = Omit<SlotOwnProps<D>, "children"> & {
  children?:
    ReactNode | ((props: MergedSlotProps<SlotOwnProps<D>>) => ReactNode);
};

/** Маркер слота: компонент-декларация со статиками вложенного compound. */
export type SlotMarker<D> = FunctionComponent<SlotProps<D>> & SlotNested<D>;

export type CompoundStatics<S extends SlotSchema> = {
  readonly [K in keyof S as Capitalize<string & K>]: SlotMarker<S[K]>;
};

/** Схема compound-компонента, снятая с его типа (для вложенных слотов). */
export type CompoundSchemaOf<C> = C extends { readonly __schema?: infer S }
  ? NonNullable<S> extends SlotSchema
    ? NonNullable<S>
    : never
  : never;

export type CompoundStaticsOf<C> = [CompoundSchemaOf<C>] extends [never]
  ? {}
  : CompoundStatics<CompoundSchemaOf<C>>;

export interface SlotObjectEntry<P extends object> {
  key?: Key | null;
  props: P;
}

type SlotInputValue<D> =
  SlotIsMultiple<D> extends true
    ? readonly SlotObjectEntry<SlotProps<D>>[]
    : SlotProps<D>;

type RequiredSlotKeys<S extends SlotSchema> = {
  [K in keyof S]: SlotIsRequired<S[K]> extends true ? K : never;
}[keyof S];

export type CompoundSlotInput<S extends SlotSchema> = {
  [K in RequiredSlotKeys<S>]-?: SlotInputValue<S[K]>;
} & {
  [K in Exclude<keyof S, RequiredSlotKeys<S>>]?: SlotInputValue<S[K]>;
};

export interface RenderSlotOptions<P extends object> {
  /** Значения по умолчанию: props потребителя перебивают их. */
  defaults?: Partial<MergedSlotProps<P>>;
  /** Узел на случай, когда слот не объявлен. */
  fallback?: ReactNode;
  /** Props владельца: перебивают потребителя по политике слияния слота. */
  inject?: Partial<MergedSlotProps<P>>;
}

export interface ResolvedSingleSlot<P extends object> {
  readonly present: boolean;
  readonly props: Readonly<SlotProps<SlotDefinition<P>>> | undefined;
  render(options?: RenderSlotOptions<P>): ReactNode;
}

export interface ResolvedMultipleSlot<P extends object> {
  readonly present: boolean;
  readonly items: readonly SlotObjectEntry<SlotProps<SlotDefinition<P>>>[];
  renderAll(
    options?: RenderSlotOptions<P> & { separator?: ReactNode },
  ): ReactNode;
}

export type ResolvedSlots<S extends SlotSchema> = {
  readonly [K in keyof S]: SlotIsMultiple<S[K]> extends true
    ? ResolvedMultipleSlot<SlotOwnProps<S[K]>>
    : ResolvedSingleSlot<SlotOwnProps<S[K]>>;
};

export interface CompoundResolution<S extends SlotSchema> {
  /** Дети, не попавшие ни в один слот. */
  content: ReactNode;
  hasContent: boolean;
  slots: ResolvedSlots<S>;
}

export type CompoundRootProps<
  P extends object,
  S extends SlotSchema,
  R = never,
> = CompoundResolution<S> & {
  forwardedRef: ForwardedRef<R>;
  props: Omit<P, "children" | "slots">;
};

export type CompoundProps<P extends object, S extends SlotSchema> = Omit<
  P,
  "children" | "slots"
> & {
  children?: ReactNode;
  slots?: CompoundSlotInput<S>;
};

export type CompoundComponent<
  P extends object,
  S extends SlotSchema,
  R = never,
> = MemoExoticComponent<
  ForwardRefExoticComponent<
    PropsWithoutRef<CompoundProps<P, S>> & RefAttributes<R>
  >
> &
  CompoundStatics<S> & {
    readonly __schema?: S;
    resolveSlots(
      children?: ReactNode,
      slots?: CompoundSlotInput<S>,
    ): CompoundResolution<S>;
  };

export interface CompoundConfig<
  P extends object,
  S extends SlotSchema,
  R = never,
> {
  name: string;
  /** Корень вызывается функцией, без промежуточного фибера. */
  render: (props: CompoundRootProps<P, S, R>) => ReactNode;
  slots: S;
}

/** Опции слота, объявленного через `slot.of` — компонент задан аргументом. */
export type SlotComponentOptions<
  C extends ElementType,
  Multiple extends boolean,
  Required extends boolean,
> = Omit<
  SlotOptions<ComponentProps<C>, Multiple, Required>,
  "component" | "multiple" | "required"
> & {
  multiple?: Multiple;
  required?: Required;
};

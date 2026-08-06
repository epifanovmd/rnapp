import type {
  ComponentType,
  ElementType,
  FC,
  ForwardedRef,
  ForwardRefExoticComponent,
  Key,
  MemoExoticComponent,
  PropsWithChildren,
  PropsWithoutRef,
  ReactNode,
  RefAttributes,
} from "react";

/** Политика слияния: значения по умолчанию + props потребителя. */
export type SlotMergeProps<P extends object> = (
  defaults: Partial<PropsWithChildren<P>>,
  props: PropsWithChildren<P>,
) => PropsWithChildren<P>;

export interface SlotOptions<
  P extends object,
  Multiple extends boolean = false,
  Required extends boolean = false,
> {
  component?: ElementType<PropsWithChildren<P>>;
  defaultProps?: Partial<PropsWithChildren<P>>;
  mergeProps?: SlotMergeProps<P>;
  multiple?: Multiple;
  required?: Required;
}

/** Опции слота с фантомным полем `__slot`: оно переносит типы в схему. */
export interface SlotDefinition<
  P extends object,
  Multiple extends boolean = false,
  Required extends boolean = false,
> extends SlotOptions<P, Multiple, Required> {
  readonly __slot: [P, Multiple, Required];
}

export type AnySlotDefinition = SlotDefinition<any, boolean, boolean>;
export type SlotSchema = Record<string, AnySlotDefinition>;

export type SlotProps<D> = D extends {
  __slot: [infer P extends object, boolean, boolean];
}
  ? PropsWithChildren<P>
  : never;

type SlotIsMultiple<D> = D extends {
  __slot: [object, infer Multiple extends boolean, boolean];
}
  ? Multiple
  : never;

type SlotIsRequired<D> = D extends {
  __slot: [object, boolean, infer Required extends boolean];
}
  ? Required
  : never;

export interface SlotObjectEntry<P extends object> {
  key?: Key | null;
  props: PropsWithChildren<P>;
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
  defaultProps?: Partial<PropsWithChildren<P>>;
  fallback?: ReactNode;
}

export interface ResolvedSingleSlot<P extends object> {
  readonly present: boolean;
  readonly props: Readonly<PropsWithChildren<P>> | undefined;
  render(options?: RenderSlotOptions<P>): ReactNode;
}

export interface ResolvedMultipleSlot<P extends object> {
  readonly present: boolean;
  readonly items: readonly SlotObjectEntry<P>[];
  renderAll(
    options?: RenderSlotOptions<P> & { separator?: ReactNode },
  ): ReactNode;
}

export type ResolvedSlots<S extends SlotSchema> = {
  readonly [K in keyof S]: SlotIsMultiple<S[K]> extends true
    ? ResolvedMultipleSlot<SlotProps<S[K]>>
    : ResolvedSingleSlot<SlotProps<S[K]>>;
};

export interface CompoundResolution<S extends SlotSchema> {
  content: ReactNode;
  contentItems: readonly ReactNode[];
  slots: ResolvedSlots<S>;
}

export type CompoundRootProps<
  P extends object,
  R,
  S extends SlotSchema,
> = CompoundResolution<S> & {
  props: Omit<P, "children" | "slots">;
  forwardedRef: ForwardedRef<R>;
};

export type CompoundProps<P extends object, S extends SlotSchema> = Omit<
  P,
  "children" | "slots"
> &
  (
    | { children?: ReactNode; slots?: never }
    | { children?: ReactNode; slots: CompoundSlotInput<S> }
  );

type CompoundStatics<S extends SlotSchema> = {
  readonly [K in keyof S as Capitalize<string & K>]: FC<SlotProps<S[K]>>;
};

export type CompoundComponent<
  P extends object,
  R,
  S extends SlotSchema,
> = MemoExoticComponent<
  ForwardRefExoticComponent<
    PropsWithoutRef<CompoundProps<P, S>> & RefAttributes<R>
  >
> &
  CompoundStatics<S> & {
    resolveSlots(
      children: ReactNode,
      slots?: CompoundSlotInput<S>,
    ): CompoundResolution<S>;
  };

export interface CompoundConfig<P extends object, R, S extends SlotSchema> {
  name: string;
  render: ComponentType<CompoundRootProps<P, R, S>>;
  slots: S;
}

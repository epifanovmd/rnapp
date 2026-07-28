---
name: Charting core
description: Skia + Reanimated chart engine (shared/ui/chart) — layer architecture, shared interaction abstractions, per-component config, events, how to add new chart types/features
type: project
---

`src/shared/ui/chart/` is a small, pluggable charting engine built on `@shopify/react-native-skia` +
`react-native-reanimated` + `react-native-gesture-handler`. Demoed on
`pages/ui-kit-demo/stack/charts/Charts.tsx` (reached via a button on the Playground tab — see
`project_screens.md`).

**No comments in this module's source** — this file is the "why". If you read a piece of code here
and the reasoning isn't obvious, it should be documented in this file, not as an inline comment.

## Hard rule: the core must not depend on this app

May **not** import `@shared/lib/theme`, `@shared/lib/di`, or any other `@shared/ui/*` component. Only
dependencies: `react`, `react-native`, `react-native-reanimated`, `react-native-gesture-handler`,
`@shopify/react-native-skia`. There is **no shared theme object** — every layer/feature takes its own
color/style props with a literal default declared in that component (e.g. `GridLayer`'s
`color = "#E2E8F0"`). A consumer bridges the app's real theme in per-prop, per-layer, at the call site
— see `pages/ui-kit-demo/stack/charts/Charts.tsx`, which reads `useTheme()` once and passes
`colors.slate200`/`colors.blue500`/etc. into each layer's props directly.

The one exception: a few **plain constants** (not a context, not injected) avoid repeating literals —
`core/default-series-colors.ts` (`DEFAULT_SERIES_COLORS`, the default value of every layer's own
`colors` prop) and `core/dash-pattern.ts` (dash presets). Each layer still owns its own prop; these are
just the single source for that prop's *default value*.

## Layer model — how composition works

Every chart type/feature is a "layer": a plain component rendered as a child of `<Chart>`, reading
shared state via `useChartContext()` (`dimensions`, `xScale`, `yScale`, `series`, `interaction`).
`Chart` (`core/Chart.tsx`) partitions its children into two buckets purely by each child's own static
`layerKind` marker (`"skia" | "overlay"`, defaults to `"skia"`):

- `"skia"` → rendered inside the Skia `<Canvas>` (chart types, grid, axis, crosshair, markers,
  reference lines).
- `"overlay"` → rendered as a plain RN `View` sibling above the canvas (tooltip needs arbitrary JSX;
  `ActivePointListener` renders nothing but still lives here since it's JS-only, no Skia node).

**Layer management is just React children** — reordering is reordering JSX (later = on top), toggling
is `{condition && <Layer/>}` or each layer's own `visible?: boolean`. Adding a layer never touches
`Chart.tsx` (Open/Closed).

**Naming: no `XImpl` + reassign.** Declare directly as the exported `const`, typed
`ChartLayerComponent<Props>`, `layerKind` assigned right after:

```ts
export const GridLayer: ChartLayerComponent<GridLayerProps> = (props) => { /* ... */ };

GridLayer.layerKind = "skia";
```

Works because `layerKind` is optional on the type, so a plain function satisfies it at assignment;
the property is added by the following statement. **One component per file** — a layer's private
subcomponents (e.g. `CrosshairLayer`'s `CrosshairSeriesIndicator`, `CrosshairXLabel`, `CrosshairYLabel`)
get their own file in the same folder.

## Folder structure & exports

Every folder has its own `index.ts` barrel (matching this codebase's convention elsewhere —
`shared/lib/holders/`, `shared/lib/socket/`), parents re-export child folders, not individual files:

```
chart/
  index.ts                       → core, features, layers, scales
  core/index.ts                  → Chart, ChartCanvas, ChartProvider, chart-context, dash-pattern,
                                    default-series-colors, interaction, resolve-series-color,
                                    select-series, types, with-opacity
  core/interaction/index.ts      → nearest-point, useAnimatedSyncedState, useChartInteraction,
                                    useOnTouchDown
  scales/index.ts                → compute-baseline, compute-domain, createBandScale, createLinearScale
  layers/index.ts                → area, bar, line, scatter
  layers/{area,bar,line,scatter}/index.ts
  features/index.ts              → active-point, axis, crosshair, grid, legend, markers,
                                    reference-line, tooltip
  features/{axis,grid,legend,reference-line,active-point}/index.ts
  features/crosshair/index.ts    → only CrosshairLayer (subcomponents are private)
  features/markers/index.ts      → MarkerLayer, types
  features/tooltip/index.ts      → TooltipContent, TooltipLayer, types
```

New file in an existing folder → add it to that folder's `index.ts` too, unless it's a private
subcomponent of another file in the same folder.

## Shared abstractions (`core/`) — reuse these before writing a new layer

- `interaction/nearest-point.ts` — `findNearestIndex` (worklet: nearest data index to a touch pixel)
  and `findActiveIndex` (same, but `-1` while `!isActive`/empty — the guard every touch-driven layer
  needs).
- `interaction/useAnimatedSyncedState.ts` — `useAnimatedSyncedState(compute, deps, initial)`: runs
  `compute` (must start with `"worklet";` — the babel plugin only auto-workletizes arguments to
  reanimated's *own* hooks, not to this wrapper) on the UI thread and syncs the result to JS state,
  re-rendering only when it changes. Used by `TooltipLayer`, `CrosshairLayer`/
  `CrosshairSeriesIndicator`, `ActivePointListener` — anywhere a worklet-computed value needs to reach
  JS-rendered text/content without a per-frame re-render.
  **Pitfall already hit once:** both callbacks of the underlying `useAnimatedReaction` (prepare *and*
  react) run on the UI thread — calling a consumer's plain (non-worklet) formatter function directly
  inside the react callback throws `"Tried to synchronously call a Remote Function"`. Only the *raw*
  value may cross via `scheduleOnRN(fn, value)`; the formatter call must happen inside `fn`, on the JS
  thread (see how `CrosshairLayer`/`CrosshairSeriesIndicator` compute `xLabelText`/`labelText` as a
  plain JS expression from the synced index, not inside the worklet).

  Uses `scheduleOnRN` from `react-native-worklets` (a direct dependency), not `runOnJS` from
  `react-native-reanimated` — the latter is deprecated in reanimated 4.x/worklets 0.11.x in favor of
  the former. Shape differs: `runOnJS(fn)(...args)` vs `scheduleOnRN(fn, ...args)` (args passed
  directly, not curried).
- `interaction/useOnTouchDown.ts` — `useOnTouchDown(touchX, touchY, isActive, onTouchDown)`: fires once
  per touch-down (rising edge of `isActive`) with the pixel position. The shared building block behind
  every press event (`BarLayer.onBarPress`, `MarkerLayer.onMarkerPress`, `ScatterLayer.onPointPress`) —
  each just hit-tests its own already-computed shapes against the reported `(x, y)`.
- `interaction/useChartInteraction.ts` — the single `usePanGesture` per chart (see `ChartInteractionOptions`:
  `enabled`, `minDistance`).
- `resolve-series-color.ts` — `resolveSeriesColor(series, index, colors)`: a series' own `color` if
  set, else the next color in the cycle. Used by every layer that colors per-series.
- `dash-pattern.ts` — `LineDashType` + `resolveDashIntervals(lineType, dashArray?)`, wraps Skia's
  `DashPathEffect`. Used by Grid, Line, Crosshair, ReferenceLine.
- `with-opacity.ts` — `withOpacity(color, opacity)`, appends alpha to a `#rrggbb` hex color (`AreaLayer`'s
  gradient/flat-fill).
- `scales/compute-baseline.ts` — `computeBaselineY(yScale, baseline?)`: pixel y of a domain baseline (0
  clamped into the domain, or a pinned value). Used by `AreaLayer` and `BarLayer`.

Reach for these before writing new logic inline — most "new layer" work is composing these plus a
Skia drawing call.

## Core pieces (`core/`)

- `types.ts` — `ChartDatum` (`{x,y,label?,meta?}`), `IChartSeries`, `IScale`, `ChartLayerComponent`.
- `chart-context.ts` — `ChartContext`/`useChartContext()`.
- `ChartProvider.tsx` — computes scales from `xDomain`/`yDomain` (auto via `compute-domain.ts`,
  honoring `xPaddingRatio`/`yPaddingRatio`/`includeZero`); `xReverse`/`yReverse` flip which end of the
  pixel range each domain end maps to.
- `Chart.tsx` — root. Measures width via `onLayout` if not given (relies on RN's default
  `alignItems: "stretch"`), requires an explicit or defaulted `height`. Props: `series`, `width?`,
  `height?`, `padding?`, `xDomain?`/`yDomain?`, `includeZero?`, `xPaddingRatio?`/`yPaddingRatio?`,
  `xReverse?`/`yReverse?`, `interactive?` (default `true`; `false` disables the pan gesture entirely —
  a read-only/decorative chart), `panActivationDistance?` (raise it if nested in a horizontally
  scrollable parent that should win small movements), `onActiveChange?: (active: boolean) => void`
  (fires on touch start/stop).
- `ChartCanvas.tsx` — `<Canvas>` renders its children through Skia's own, separate React reconciler, so
  a `ChartContext.Provider` from the host tree never reaches components mounted inside it. This bridge
  reads the context in the host tree and re-provides it as part of the element tree handed to
  `<Canvas>`, threading it through inside Skia's reconciler too.

## Scales (`scales/`)

- `createLinearScale` — continuous; `toRange`/`toDomain`/`ticks` are themselves worklets, so a scale
  object can be captured inside a UI-thread `useDerivedValue` (crosshair snapping needs this).
- `createBandScale` — categorical, index-based; only `BarLayer` uses it for x-positioning (bars are
  addressed by category index, not a continuous x — combining with `LineLayer`/`AreaLayer` only lines
  up if categories match the other series' x values).
- `compute-domain.ts` / `compute-baseline.ts` — see above.
- No separate time-scale: a time series is a linear scale over `Date#getTime()`, with `formatLabel` on
  `AxisLayer` for date formatting.

## Standard chart types (`layers/`)

- `line/LineLayer.tsx` (+ `build-line-path.ts`, shared by Area) — `curve: "linear"|"smooth"`, `colors`,
  `strokeWidth`, `strokeCap`/`strokeJoin`, `lineType`/`dashArray`.
- `area/AreaLayer.tsx` — baseline via `computeBaselineY` (or pinned via `baseline`), gradient fill by
  default or flat via `gradient={false}`. `colors`, `opacity`.
- `bar/BarLayer.tsx` — grouped bars on a band scale. `colors`, `cornerRadius`, `gapRatio`,
  `borderColor`/`borderWidth`, `onBarPress?: (info: { seriesId, datum, index }) => void` (hit-tests the
  same rects it renders, via `useOnTouchDown`).
- `scatter/ScatterLayer.tsx` — one marker per data point (continuous `xScale`/`yScale`, not banded).
  `radius`, `colors`, `style: "fill"|"stroke"`, `hitSlop`,
  `onPointPress?: (info: { series, datum, index }) => void`.

Compose freely (`AreaLayer`+`LineLayer` on the same series = filled line chart; `BarLayer` for one
series + `LineLayer` for another = combo chart).

## Standard features (`features/`)

- `grid/GridLayer.tsx` — tick gridlines. `color`, `strokeWidth`, `lineType`/`dashArray`.
- `axis/AxisLayer.tsx` — `orientation: "x"|"y"`, `position` (`"top"|"bottom"` / `"left"|"right"` —
  drawing on the non-default side only *draws* there, doesn't reserve space, so give `<Chart>` matching
  `padding`). Tick text via `matchFont({ fontFamily, fontSize })` + `font.measureText()` for
  centering/right-alignment. `formatLabel?`, `color`/`lineWidth`, `showAxisLine`, `labelColor`/
  `fontSize`/`fontFamily`, `showTicks`/`tickLength`.
- `crosshair/CrosshairLayer.tsx` — shared vertical line + per-series horizontal line/marker/value chip,
  crossing exactly at each series' own nearest point (each computed independently via its own
  `CrosshairSeriesIndicator`, so correct even if series don't share x values). `color`/`colors`,
  `lineType`/`dashArray`. `showXLabel`/`showYLabels` value chips at the axis edge —
  `xLabelPosition`/`yLabelPosition` are **independent of `AxisLayer`'s own `position`** (draw the axis
  left, the crosshair chip right). Positions driven by `useDerivedValue` (UI thread); label text via
  `useAnimatedSyncedState` (see the pitfall note above).
- `markers/MarkerLayer.tsx` — static (non-touch-following) annotations: `markers: ChartMarker[]`, each
  with a `MarkerAnchor` (`markers/types.ts`) of kind `"series"` (nearest point on a series at domain
  x), `"domain"` (arbitrary `{x,y}` via scales) or `"pixel"` (raw canvas position, bypasses scales).
  `colors`, `hitSlop`, `onMarkerPress?: (marker: ChartMarker) => void` (hit-tested via
  `useOnTouchDown` against each resolved marker's radius + `hitSlop`).
- `reference-line/ReferenceLineLayer.tsx` — a static line at a fixed domain value (`axis: "x"|"y"`,
  `value`), optional `label`. Same `lineType`/`dashArray` as Grid/Line/Crosshair. For thresholds/
  targets/averages — pairs with `MarkerLayer` (point annotations) to cover line annotations too.
- `legend/Legend.tsx` — **not a `<Chart>` layer** (no `layerKind`, doesn't read `useChartContext()`) —
  a standalone component taking the same `series` array, rendered as a sibling of `<Chart>` wherever
  the consumer wants it. `colors`, `textColor`, `direction`, `onItemPress?: (series) => void`.
- `active-point/ActivePointListener.tsx` — headless layer (renders `null`): calls
  `onChange?: (points: ActivePoint[] | null) => void` with the nearest data point per series whenever
  the active touch index changes, `null` once touch ends. Lets any consumer react to "what point is
  under the finger" without needing `TooltipLayer`/`CrosshairLayer` — the "add an event" pattern for
  touch-driven data, as opposed to `Chart.onActiveChange` which only reports the boolean touching state.
- `tooltip/TooltipLayer.tsx` (overlay) — position via `useAnimatedStyle` (UI thread), content via
  `useAnimatedSyncedState` synced on index change. `colors` (default content's per-series dots),
  `backgroundColor`/`textColor` (default content, ignored if `renderContent` given),
  `onVisibilityChange?: (visible: boolean) => void`. `renderContent?: (points) => ReactNode` fully
  replaces content — untouched on charts that don't set it. `anchorToPoint?: boolean` (default
  `false`, raw finger position): when `true`, an extra `useDerivedValue` re-anchors the tooltip to
  the reference series' (`series[0]`) active data point in pixel space (`xScale.toRange`/
  `yScale.toRange` at the active index) instead of `touchX`/`touchY` — for "snap to the line" UX.
  `side?: "top" | "bottom" | "left" | "right"` (default `"top"`) picks which edge of the anchor the
  box is offset toward, same `offset` prop controls the gap in both dimensions.

## Events — the pattern

Every touch-driven press event (`BarLayer.onBarPress`, `MarkerLayer.onMarkerPress`,
`ScatterLayer.onPointPress`) is built the same way: compute the shapes' pixel positions once (already
needed for rendering), call `useOnTouchDown(interaction.touchX, interaction.touchY, interaction.isActive, ...)`,
hit-test the reported pixel against the precomputed shapes in the JS callback. `Chart.onActiveChange`
and `TooltipLayer.onVisibilityChange` are simpler — a direct `useAnimatedReaction` on `isActive`.
`ActivePointListener.onChange` is the general "give me the active data" event, built on
`useAnimatedSyncedState` + `findActiveIndex`, for consumers who want touch-driven data without opting
into Tooltip/Crosshair's rendering.

## Adding a new chart type or feature

1. New folder under `layers/` or `features/`, with its own `index.ts`.
2. Component reads `useChartContext()`; take your own color/style props with literal defaults (reuse
   `DEFAULT_SERIES_COLORS` for a `colors` prop). Reach for the shared abstractions above before writing
   new interaction/color/baseline logic.
3. Set `MyLayer.layerKind = "skia"` or `"overlay"`.
4. Re-export from the folder's `index.ts`, and the parent folder's `index.ts` if the folder is new.
5. Consumers add `<MyLayer />` as a `<Chart>` child (or, if it's a non-context standalone piece like
   `Legend`, as a sibling) — nothing else changes.

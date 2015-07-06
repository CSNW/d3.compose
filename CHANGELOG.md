# 0.13.0

- Add responsive support for `div` selections, with `width` and `height` used for `viewBox`
- Add `StandardLayer` to improve extensibility in standard charts and components
- Add `Transition` mixin for standard approach to adding `duration`, `delay`, and `ease` to charts/layers
- __0.13.1__ Add `Overlay` component and layer type
- __0.13.2__ Add `xKey` and `yKey` to `mixins.XY` and lots of docs updates

# 0.12.0

- Add `centered` and `adjacent` options for `createScale`
- Move x calculations for Values to `createScale`
- Remove `LineValues` and `AxisValues` to use scale instead
- Rename `Line` to `Lines`
- Bugfixes in `Legend`, `Axis`, and `Multi`
- Refactor `Lines` chart
- Add hover to labels
- Move hover points into separate `HoverPoints` mixin
- Refactor mouse events
- __0.12.1__ Complete rename to d3.compose
- __0.12.2__ Move xy to d3.compose namespace
- __0.12.3__ Fix version number
- __0.12.4__ Fix data handling bug in Compose.draw, fix examples, and move `stack` back to helpers
- __0.12.5__ Handle `line-height: normal` in `alignText`
- __0.12.6__ Split merge and layout in labels for better override
- __0.12.7__ Fix cached config bug
- __0.12.8__ Fix improperly updating series class/style bug
- __0.12.9__ Fix Lines indexing bug and set class/style for charts on merge instead of insert
- __0.12.10__ Allow 0/null for transition (delay, duration, ease) values
- __0.12.11__ Use utils instead of underscore
- __0.12.12__ Fix label collisions bug
- __0.12.13__ Add `HorizontalBar` and `HorizontalStackedBars`; make `Bars`, `Lines`, and `Title` more extensible; fix `undefined` data bug; namespace charts
- __0.12.14__ Add horizontal bars swatch to legend

# 0.11.0

- New legend data format
- Fix creating legend from `xy` extension
- New `registerSwatch` method (move method out of charts)
- More options
- Split build into three parts: core, core + mixins, core + mixins + charts/components
- Simplify and cleanup
- __0.11.1__ Labels extension bugfix and Bars offset bugfix

# 0.10.0

- Simplify charts and components
- Simplify draw/redraw
- Simplify attach/detach
- Simplify properties
- Merge `Container` and `Multi`
- Move axes, title, and legend out of Multi and into `xy` extension
- Move z-index out of helpers
- Isolate underscore in utils
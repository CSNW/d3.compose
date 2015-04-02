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

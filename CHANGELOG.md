# 0.15.0

- Add Gridlines component
- Update and simplify `property`
- Update label positioning
- Update class system to remove implicit initialize and transform cascade
- Remove deprecated xy extension and Object-style layout
- __0.15.1__ Fix Overlay.position and labels with stacked bars bugs
- __0.15.2__ Fix Gridlines onExit bug and slide down Bars on exit
- __0.15.3__ Fix layout calculation and axis transition bugs
- __0.15.4__ Fix component centering and mousemove in IE bugs
- __0.15.5__ Fix `__proto__` and Overlay transform issues
- __0.15.6__ Fix Legend type not updating bug
- __0.15.7__ Add banner to dist css and tweak label defaults
- __0.15.8__ Fix margins issue for centered components
- __0.15.9__ Fix delayed gridlines attachment bug and fix undefined config issue
- __0.15.10__ Fix legend expanding on redraw issue
- __0.15.11__ Update build (remove grunt), start new draw architecture, convert tests to mocha + jsdom
- __0.15.12__ Include license/version in minified dist
- __0.15.13__ Improve backwards compatibility with new architecture
- __0.15.14__ Fix small height issue for stacked bars
- __0.15.15__ Fix broken build

# 0.14.0

- New layout system
- Remove dependency on Underscore
- Only set `charts` and `components` from options function
- Convert `Compose.charts` and `Compose.components` to arrays
- Add helpers for charts and components
- Update mouse listening
- Update overlay positioning
- New module system
- __0.14.1__ Fix undefined `XYInverted` bug
- __0.14.2__ Expose d3c global
- __0.14.3__ Add `Text` and `AxisTitle` components, update default margins, add `centered` component property
- __0.14.4__ Set transitions on `Compose`, update `stack`, and add hover listeners to `Legend`
- __0.14.5__ Disable x0 and y0 position for axes until tested more thoroughly, refactor layout
- __0.14.6__ Fix vertical Axis bug, absolute positioning Compose bug, unknown position bug, and property.previous bug
- __0.14.7__ (Temporarily) Re-instantiate component on position change to avoid nasty side effects

# 0.13.0

- Add responsive support for `div` selections, with `width` and `height` used for `viewBox`
- Add `StandardLayer` to improve extensibility in standard charts and components
- Add `Transition` mixin for standard approach to adding `duration`, `delay`, and `ease` to charts/layers
- __0.13.1__ Add `Overlay` component and layer type
- __0.13.2__ Add `xKey` and `yKey` to `mixins.XY` and lots of docs updates
- __0.13.3__ For `xy`, add given components after generated
- __0.13.4__ Clear unset options on set and fix axis layout issue for inverted
- __0.13.5__ Fix bars axis offset issue
- __0.13.6__ Additional bar offset tweaks

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

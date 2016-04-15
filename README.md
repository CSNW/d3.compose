# d3.compose

Compose rich, data-bound charts from charts (like Lines and Bars) and components (like Axis, Title, and Legend) with d3 and d3.chart.

- Advanced layout engine automatically positions and sizes charts and components, layers by z-index, and is responsive by default with automatic scaling
- Standard library of charts and components for quickly creating beautiful charts
- `Chart` and `Component` bases for creating composable and reusable charts and components
- Includes helpers and mixins that cover a range of standard functionality
- CSS class-based styling is extensible and easy to customize to match your site

[![npm version](https://img.shields.io/npm/v/d3.compose.svg?style=flat-square)](https://www.npmjs.com/package/d3.compose)
[![Code Climate](https://img.shields.io/codeclimate/github/CSNW/d3.compose.svg?style=flat-square)](https://codeclimate.com/github/CSNW/d3.compose)

## Getting Started

1. Download the [latest release](https://github.com/CSNW/d3.compose/releases)
2. Download the dependencies:

    - [D3.js (>= 3.0.0)](http://d3js.org/)
    - [d3.chart (>= 0.2.0)](http://misoproject.com/d3-chart/)

3. Add d3.compose and dependencies to your html:

    ```html
    <!doctype html>
    <html>
      <head>
        <!-- ... -->

        <link rel="stylesheet" type="text/css" href="d3.compose.css">
      </head>
      <body>
        <!-- ... -->

        <script src="d3.js"></script>
        <script src="d3.chart.js"></script>

        <script src="d3.compose.js"></script>

        <!-- Your code -->
      </body>
    </html>
    ```

4. Create your first chart

    ```js
    var chart = d3.select('#chart')
      .chart('Compose', function(data) {
        var scales = {
          x: {type: 'ordinal', data: data, key: 'x'},
          y: {data: data, key: 'y'}
        };

        var charts = [
          d3c.lines({
            data: data,
            xScale: scales.x,
            yScale: scales.y
          })
        ];

        var yAxis = d3c.axis({scale: scales.y});

        return [
          [yAxis, d3c.layered(charts)]
        ];
      })
      .width(600)
      .height(400);

    chart.draw([{x: 0, y: 10}, {x: 10, y: 50}, {x: 20, y: 30}]);
    ```

## Examples and Docs

See [http://CSNW.github.io/d3.compose/](http://CSNW.github.io/d3.compose/) for live examples and docs.

## Development

1. Install modules `npm install`
2. Test with `npm test` or `npm run test:watch`
3. Build with `npm run build`

Note on testing: Requires Node 4+ (for latest jsdom) and d3.chart doesn't currently support running from within node
and requires the following line be added inside the IIFE in `node_modules/d3.chart.js`: `window = this;` (before `use strict`). This will be resolved by a [pending PR](https://github.com/misoproject/d3.chart/pull/113) to fix this issue with d3.chart (also, the dependency on d3.chart is likely to be removed in a later version of d3.compose).

### Release

(With all changes merged to master and on master branch)

1. `npm version {patch|minor|major|version}`
2. `npm publish`

### Docs

1. On master, run `npm run docs`
2. Switch to `gh-pages` branch
3. Navigate to `_tasks` directory (`cd _tasks`)
4. (`npm install` _tasks, if necessary)
5. Run docs task `npm run docs`
6. Navigate back to root
7. View site with `bundle exec jekyll serve`

Note: For faster iteration, create a separate clone, switch to `gh-pages` branch, set `docs_path` environment variable to original clone (e.g. Windows: `SET docs_path=C:\...\d3.compose\_docs\`), and then run steps 3-6.

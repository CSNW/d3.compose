# d3.chart.multi

Build advanced data-bound charts with d3.chart

## Example

```js
var data = [
  {key: 'input', name: 'Input', values: [{key: ..., x: ..., y: ...}, ...]},
  {key: 'output', name: 'Output', values: [{key: ..., x: ..., y: ...}, ...]}
];

var chart = d3.select('.chart')
.chart('Multi', function(data) {
  // Prepare data for chart configuration
  var input = _.filter(data, {key: 'input'});
  var output = _.filter(data, {key: 'output'});
  var scales = {
    x: d3.helpers.scaleFromOptions({data: data, select: 'x'}),
    y1: d3.helpers.scaleFromOptions({data: input, select: 'y'}),
    y2: d3.helpers.scaleFromOptions({data: output, select: 'y'})
  };

  // Setup configuration for drawing chart
  return {
    charts: {
      line: {
        type: 'Line',
        data: input,

        xScale: scales.x,
        yScale: scales.y1,

        labels: {
          format: ',0d',
          // data: [optional...]
        }
      },
      bars: {
        type: 'Bars',
        data: output,

        xScale: scales.x,
        yScale: scales.y2
      }
    },
    axes: {
      x: {scale: scales.x, title: '...', position: 'bottom'},
      y: {scale: scales.y, title: '...', position: 'left'}
    },
    legend: {
      charts: ['line', 'bars'],
      // data: [optional...]
    },
    title: 'Chart Title...'
  };
});

chart.draw(data);
```

## Getting Started

Add the following to your page:

```html
...
<head>
  <!-- ... -->
  <link rel="stylesheet" type="text/css" href="css/d3.chart.multi.css">
</head>
<body>
  <!-- ... -->
  <script src="js/d3.js"></script>
  <script src="js/d3.chart.js"></script>
  <script src="js/underscore.js"></script>
  <script src="js/d3.chart.multi.js"></script>
</body>
```

## Development

Install bower (if necessary) `npm install -g bower`

1. Install components `npm install` and `bower install`
2. Build with `grunt build`
3. Open example with `grunt server` and `localhost:4001`
4. Test with `grunt test` or automatically with `grunt watch:test`

Release
-------
(With all changes merged to master and on master branch)

1. Set version in `package.json` and `bower.json`
2. Build release with `grunt release`
3. Commit files `git commit -am "v#.#.# Summary..."`
4. Tag commit with version `git tag v#.#.#`
5. Push changes to remote `git push` and `git push --tags`

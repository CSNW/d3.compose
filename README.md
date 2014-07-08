d3.chart.multi
--------------------------

Build advanced charts easily using configuration.

Example
-------

```html
<!-- Add the following to your page (with css/js paths updated for your structure -->
<link rel="stylesheet" type="text/css" href="css/d3.chart.multi.base.css">

<!-- Body... -->

<script src="js/d3.js"></script>
<script src="js/d3.chart.js"></script>
<script src="js/underscore.js"></script>
<script src="js/d3.chart.multi.js"></script>
```

```js
var data = {
  input: [{key: 'input', values: [{key: '2000', value: 100}/*, ... */]}],
  output: [{key: 'output', values: [{key: '2000', value: 100}/*, ... */]}]
};

var chart = d3.select('#chart')
  .append('svg')
  .chart('Multi', {
    type: 'Values',
    charts: [
      {
        type: 'Line',
        dataKey: 'input',
        labels: {
          position: 'top'
        }
      },
      {
        type: 'Bars', 
        dataKey: 'output', 
        labels: {
          format: d3.format(',0d')
        }
      }
    ],
    axes: {
      x: {
        title: 'X Title'
      },
      y: {
        scale: {domain: [0, 20000]}, 
        title: 'Y1 Title'
      },
      secondaryY: {
        dataKey: 'input', 
        scale: {domain: [0, 90]}, 
        title: 'Y2 Title'
      }
    },
    legend: {
      type: 'Inset',
      position: {x: 10, y: 0}
    },
    title: 'Chart Title'
  })
  .width(600)
  .height(400)
  .chartMargins({top: 10, right: 10, bottom: 10, left: 10});

chart.draw(data);
```

Development
-----------
Install bower (if necessary) `npm install -g bower`

1. Install components `npm install && bower install`
2. Open example `example/index.html`
3. Test with `grunt test` or automatically with `grunt watch:test`

Release
-------
(With all changes merged to master and on master branch)

1. Set version in `package.json` and `bower.json`
2. Build release with `grunt release`
3. Commit files `git commit -am "v#.#.# Summary..."`
4. Tag commit with version `git tag v#.#.#`
5. Push changes to remote `git push origin master --follow-tags` (with Git v1.8.3 or above, otherwise `git push` then `git push --tags`)

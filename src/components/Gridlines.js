import d3 from 'd3';
import { contains } from '../utils';
import {
  createHelper,
  di,
  mixin,
  property
} from '../helpers';
import {
  XY,
  Transition,
  StandardLayer
} from '../mixins';
import Component from '../Component';

/**
  Gridlines component that draws major ticks for chart

  Uses d3.axis extensions for ticks:

  - `ticks`
  - `tickValues`

  ### Extending

  To extend the `Gridlines` component, the following methods are available

  - `onInsert`
  - `onEnter`
  - `onEnterTransition`
  - `onUpdate`
  - `onUpdateTransition`
  - `onMerge`
  - `onMergeTransition`
  - `onExit`
  - `onExitTransition`

  @example
  ```js
  d3.select('#chart').chart('Compose', function(data) {
    var scales = {
      x: {data: data, key: 'x'},
      y: {data: data, key: 'y'}
    };

    var vertical = d3c.gridlines({
      scale: scales.x,
      orientation: 'vertical'
    });
    var horizontal = d3c.gridlines({
      scale: scales.y,
      orientation: 'horizontal'
    });

    return [
      vertical,
      horizontal
    ];
  });
  ```
  @class Gridlines
*/
var Gridlines = Component.extend('Gridlines', mixin(XY, Transition, StandardLayer, {
  initialize: function() {
    // Use standard layer for extensibility
    this.standardLayer('Gridlines', this.base.append('g').attr('class', 'chart-gridlines'));
  },

  /**
    Use horizontal, vertical gridlines

    @property orientation
    @type String
    @default horizontal
  */
  orientation: property('orientation', {
    default_value: 'horizontal',
    validate: function(value) {
      return contains(['horizontal', 'vertical'], value);
    },
    set: function() {
      // Update scale -> xScale/yScale when position changes
      if (this.scale())
        this.scale(this.scale());
    }
  }),

  /**
    Scale to use for gridlines.
    Can be `d3.scale` or, if `Object` is given, `helpers.createScale` is used.

    @example
    ```js
    // Set with d3.scale directly
    gridlines.scale(d3.scale());

    // or with Object passed to helpers.createScale
    gridlines.scale({data: data, key: 'x'});
    ```
    @property scale
    @type Object|d3.scale
  */
  scale: property('scale', {
    type: 'Function',
    set: function(value) {
      if (this.orientation() == 'vertical') {
        this.xScale(value);
        value = this.xScale();
      }
      else {
        this.yScale(value);
        value = this.yScale();
      }

      return {
        override: value
      };
    }
  }),

  // d3.axis extensions
  ticks: property('ticks', {
    type: 'Function',
    default_value: [10]
  }),
  tickValues: property('tickValues', {type: 'Function'}),

  drawLine: di(function(chart, d) {
    var x1, x2, y1, y2;
    if (chart.orientation() == 'vertical') {
      x1 = x2 = chart.xScale()(d);
      y1 = 0;
      y2 = chart.height();
    }
    else {
      x1 = 0;
      x2 = chart.width();
      y1 = y2 = chart.yScale()(d);
    }

    console.log(d, 'x1', x1, 'x2', x2, 'y1', y1, 'y2', y2);

    d3.select(this)
      .attr('x1', x1)
      .attr('x2', x2)
      .attr('y1', y1)
      .attr('y2', y2);
  }),

  onDataBind: function onDataBind(selection) {
    var tick_values = this.tickValues();
    if (tick_values == null) {
      // Get tick values from scale
      var scale = this.orientation() == 'vertical' ? this.xScale() : this.yScale();
      tick_values = scale.ticks ? scale.ticks.apply(scale, this.ticks()) : scale.domain();
    }
    console.log(tick_values);
    return selection.selectAll('line').data(tick_values);
  },
  onInsert: function onInsert(selection) {
    return selection.append('line')
      .attr('class', 'chart-gridline');
  },
  onMerge: function onMerge(selection) {
    selection
      .attr('opacity', 0)
      .each(this.drawLine);
  },
  onMergeTransition: function onMergeTransition(selection) {
    selection.attr('opacity', 1);
  },
  onExit: function onExit(selection) {
    selection.selectAll('line').remove();
  },

  skip_layout: true
}), {
  layer_type: 'chart',
  z_index: 55
});

var gridlines = createHelper('Gridlines');

export {
  Gridlines as default,
  gridlines
};

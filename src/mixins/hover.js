import {
  property,
  isSeriesData,
  di
} from '../helpers';
import {
  compact,
  pluck,
  objectEach,
  contains
} from '../utils';

/**
  Mixin for handling common hover behavior that adds standard `onMouseEnter`, `onMouseMove`, and `onMouseLeave` handlers
  and `getPoint` helper for adding helpful meta information to raw data point.

  @class Hover
  @namespace mixins
*/
var Hover = {
  initialize: function() {
    this.on('attach', function() {
      this.container.on('mouseenter', this.onMouseEnter.bind(this));
      this.container.on('mousemove', this.onMouseMove.bind(this));
      this.container.on('mouseleave', this.onMouseLeave.bind(this));
    }.bind(this));
  },

  /**
    Get point information for given data-point

    @method getPoint
    @param {Any} d
    @param {Number} i
    @param {Number} j
    @return {key, series, d, meta {chart, i, j, x, y}}
  */
  getPoint: di(function(chart, d, i, j) {
    var key = chart.key && chart.key.call(this, d, i, j);
    var series = chart.seriesData && chart.seriesData.call(this, d, i, j) || {};

    return {
      key: (series.key || j) + '.' + (key || i),
      series: series,
      d: d,
      meta: {
        chart: chart,
        i: i,
        j: j,
        x: chart.x && chart.x.call(this, d, i, j),
        y: chart.y && chart.y.call(this, d, i, j)
      }
    };
  }),

  /**
    Call to trigger mouseenter:point when mouse enters data-point

    @example
    ```js
    d3.chart('Chart').extend('Bars', helpers.mixin(Hover, {
      initialize: function() {
        this.layer('bars', this.base, {
          // dataBind...
          insert: function() {
            // Want to trigger enter/leave point
            // when mouse enter/leaves bar (rect)
            var chart = this.chart();
            return this.append('rect')
              .on('mouseenter', chart.mouseEnterPoint)
              .on('mouseleave', chart.mouseLeavePoint);
          }
          // events...
        })
      }
    }));
    ```
    @method mouseEnterPoint
    @param {Any} d
    @param {Number} i
    @param {Number} j
  */
  mouseEnterPoint: di(function(chart, d, i, j) {
    chart.container.trigger('mouseenter:point', chart.getPoint.call(this, d, i, j));
  }),

  /**
    Call to trigger mouseleave:point when mouse leaves data-point

    @example
    ```js
    d3.chart('Chart').extend('Bars', helpers.mixin(Hover, {
      initialize: function() {
        this.layer('bars', this.base, {
          // dataBind...
          insert: function() {
            // Want to trigger enter/leave point
            // when mouse enter/leaves bar (rect)
            var chart = this.chart();
            return this.append('rect')
              .on('mouseenter', chart.mouseEnterPoint)
              .on('mouseleave', chart.mouseLeavePoint);
          }
          // events...
        })
      }
    }));
    ```
    @method mouseleavePoint
    @param {Any} d
    @param {Number} i
    @param {Number} j
  */
  mouseLeavePoint: di(function(chart, d, i, j) {
    chart.container.trigger('mouseleave:point', chart.getPoint.call(this, d, i, j));
  }),

  /**
    (Override) Called when mouse enters container

    @method onMouseEnter
    @param {Object} position (chart and container {x,y} position of mouse)
    @param {Object} position.chart {x, y} position relative to chart origin
    @param {Object} position.container {x, y} position relative to container origin
  */
  onMouseEnter: function(/* position */) {},

  /**
    (Override) Called when mouse moves within container

    @method onMouseMove
    @param {Object} position (chart and container {x,y} position of mouse)
    @param {Object} position.chart {x, y} position relative to chart origin
    @param {Object} position.container {x, y} position relative to container origin
  */
  onMouseMove: function(/* position */) {},

  /**
    (Override) Called when mouse leaves container

    @method onMouseLeave
  */
  onMouseLeave: function() {}
};

/**
  Mixin for automatically triggering "mouseenter:point"/"mouseleave:point" for chart data points that are within given `hoverTolerance`.

  @class HoverPoints
  @namespace mixins
*/
var HoverPoints = {
  initialize: function() {
    var points, tolerance, active;

    this.on('draw', function() {
      // Clear cache on draw
      points = null;
    });

    this.on('attach', function() {
      var update = function update(position) {
        var closest = [];
        if (position)
          closest = getClosestPoints(points, position.chart, tolerance);

        updateActive(active, closest, this.container);
        active = closest;
      }.bind(this);

      this.container.on('mouseenter', function(position) {
        if (!points)
          points = getPoints(this, this.data());

        tolerance = this.hoverTolerance();
        update(position);
      }.bind(this));

      this.container.on('mousemove', update);
      this.container.on('mouseleave', update);
    }.bind(this));
  },

  /**
    Hover tolerance (in px) for calculating close points

    @property hoverTolerance
    @type Number
    @default Infinity
  */
  hoverTolerance: property({
    default_value: Infinity
  })
};

function getPoints(chart, data) {
  if (data) {
    if (!isSeriesData(data))
      data = [{values: data}];

    return data.map(function(series, j) {
      return series.values.map(function(d, i) {
        return chart.getPoint.call({_parent_data: series}, d, i, j);
      }).sort(function(a, b) {
        // Sort by x
        return a.meta.x - b.meta.x;
      });
    });
  }
}

function getClosestPoints(points, position, tolerance) {
  return compact(points.map(function(series) {
    function setDistance(point) {
      point.distance = getDistance(point.meta, position);
      return point;
    }
    function closePoints(point) {
      return point.distance < tolerance;
    }
    function sortPoints(a, b) {
      if (a.distance < b.distance)
        return -1;
      else if (a.distance > b.distance)
        return 1;
      else
        return 0;
    }

    var by_distance = series.map(setDistance).filter(closePoints).sort(sortPoints);

    return by_distance[0];
  }));

  function getDistance(a, b) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }
}

function updateActive(active, closest, container) {
  var active_keys = pluck(active, 'key');
  var closest_keys = pluck(closest, 'key');

  objectEach(closest, function(point) {
    if (contains(active_keys, point.key))
      container.trigger('mousemove:point', point);
    else
      container.trigger('mouseenter:point', point);
  });
  objectEach(active, function(point) {
    if (!contains(closest_keys, point.key))
      container.trigger('mouseleave:point', point);
  });
}

export {
  Hover as default,
  HoverPoints
};

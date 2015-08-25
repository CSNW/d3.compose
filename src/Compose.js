import d3 from 'd3';
import {
  isFunction,
  find,
  defaults,
  extend,
  objectEach,
  difference,
  pluck
} from './utils';
import {
  getMargins,
  property,
  style,
  translate
} from './helpers';
import {
  extractLayout,
  calculateLayout,
  applyLayout
} from './layout';
import Base from './Base';
import Overlay from './Overlay';
var default_compose_margins = {top: 10, right: 10, bottom: 10, left: 10};

/**
  Compose rich, data-bound charts from charts (like Lines and Bars) and components (like Axis, Title, and Legend) with d3 and d3.chart.
  Using the `options` property, charts and components can be bound to data and customized to create dynamic charts.

  @example
  ```html
  <div id="#chart"></div>
  ```
  ```js
  var chart = d3.select('#chart').chart('Compose', function(data) {
    // Process data...

    // Create shared scales
    var scales = {
      x: {data: data.input, key: 'x', adjacent: true},
      y: {data: data.input, key: 'y'},
      y2: {data: data.output, key: 'y'}
    };

    // Setup charts and components
    var charts = [
      d3c.bars('input', {data: data.input, xScale: scales.x, yScale: scales.y}),
      d3c.lines('output', {data: data.output, xScale: scales.x, yScale: scales.y2})
    ];

    var title = d3c.title('d3.compose');
    var yAxis = d3c.axis({scale: scales.y});
    var y2Axis = d3c.axis({scale: scales.y2});

    // Layout charts and components
    return [
      [yAxis, d3c.layered(charts), y2Axis]
    ];;
  });

  chart.draw({input: [...], output: [...]});
  ```
  @class Compose
  @extends Base
*/
var Compose = Base.extend({
  initialize: function(options) {
    Base.prototype.initialize.call(this, options);

    // Responsive svg based on the following approach (embedded + padding hack)
    // http://tympanus.net/codrops/2014/08/19/making-svgs-responsive-with-css/
    // (not enabled if selection is svg)
    if (this.base.node().tagName != 'svg') {
      this.container = this.base.append('div')
        .attr('class', 'chart-compose-container');

      this.base = this.container.append('svg')
        .attr('xlmns', 'http://www.w3.org/2000/svg')
        .attr('version', '1.1')
        .attr('class', 'chart-compose');
    }
    else {
      this.base.classed('chart-compose', true);
    }

    this.attachHoverListeners();
  },

  transform: function(data) {
    // Save raw data for redraw
    this.rawData(data);
    return Base.prototype.transform.call(this, data);
  },

  /**
    Get/set the options `object/function` for the chart that takes `data` and
    returns `{charts, components}` for composing child charts and components.

    @example
    ```js
    // get
    chart.options();

    // set (static)
    chart.options({
      charts: {},
      components: {}
    });

    // set (dynamic, takes data and returns options)
    chart.options(function(data) {
      // process data...

      return {
        charts: {},
        components: {}
      };
    });

    // Set directly from d3.chart creation
    d3.select('#chart')
      .chart('Compose', function(data) {
        // ...
      });
    ```
    @property options
    @type Function|Object
  */
  options: property({
    default_value: function() { return function() {}; },
    set: function(options) {
      // If options is plain object,
      // return from generic options function
      if (!isFunction(options)) {
        return {
          override: function() {
            return options;
          }
        };
      }
    }
  }),

  // Store raw data for container before it has been transformed
  rawData: property(),

  /**
    Margins between edge of container and components/chart

    @example
    ```js
    chart.margins({top: 10, right: 20, bottom: 10, left: 20});
    ```
    @property margins
    @type Object {top, right, bottom, left}
    @default {top: 10, right: 10, bottom: 10, left: 10}
  */
  margins: property({
    default_value: default_compose_margins,
    set: function(values) {
      return {
        override: getMargins(values, default_compose_margins)
      };
    }
  }),

  // Chart position
  chartPosition: property({
    default_value: {top: 0, right: 0, bottom: 0, left: 0},
    set: function(values) {
      return {
        override: defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0})
      };
    },
    get: function(values) {
      values.width = this._width() - values.right - values.left;
      values.height = this._height() - values.bottom - values.top;

      return values;
    }
  }),

  /**
    Get/set overall width of chart

    @property width
    @type Number
  */
  width: property({
    default_value: null
  }),

  /**
    Get/set overall height of chart

    @property height
    @type Number
  */
  height: property({
    default_value: null
  }),

  _width: function() {
    var width = this.width();
    return width != null ? width : Base.prototype.width.call(this);
  },
  _height: function() {
    var height = this.height();
    return height != null ? height : Base.prototype.height.call(this);
  },

  /**
    Enable responsive container + viewBox so that chart scales to fill width
    (only works if selection is not an svg)

    @property responsive
    @type Boolean
    @default true
  */
  responsive: property({
    default_value: true
  }),

  // Set svg viewBox attribute
  viewBox: property({
    default_value: function() {
      if (this.responsive() && this.width() && this.height())
        return '0 0 ' + this.width() + ' ' + this.height();
      else
        return null;
    }
  }),

  // Set svg preserveAspectRatio attribute
  preserveAspectRatio: property({
    default_value: function() {
      if (this.responsive())
        return 'xMidYMid meet';
      else
        return null;
    }
  }),

  // Set container style
  containerStyle: property({
    default_value: function() {
      if (this.responsive()) {
        var aspect_ratio = 1;
        if (this.width() && this.height())
          aspect_ratio = this.height() / this.width();

        return style({
          width: '100%',
          height: 0,
          'padding-top': (aspect_ratio * 100) + '%',
          position: 'relative'
        });
      }
      else {
        return style({position: 'relative'});
      }
    }
  }),

  // Set base style
  baseStyle: property({
    default_value: function() {
      if (this.responsive() && this.container) {
        return style({
          position: 'absolute',
          top: 0,
          left: 0
        });
      }
      else {
        return null;
      }
    }
  }),

  /**
    Set charts from options or get chart instances.
    Each chart should use a unique key so that updates are passed to the existing chart
    (otherwise they are recreated on update).
    The `type` option must be a registered `d3.chart` and all other options are passed to the chart.

    @example
    ```js
    chart.charts([
      {id: 'input', type: 'Bars'}, // options to pass to Bars chart
      {id: 'output', type: 'Lines'} // options to pass to Lines chart
    ]);
    ```
    @property charts
    @type Array
  */
  charts: property({
    set: function(chart_options, charts) {
      // Store actual charts rather than options
      return {
        override: this._attachItems(chart_options, charts, this)
      };
    },
    default_value: []
  }),

  /**
    Set components from options or get components instances.
    Each component should use a unique key so that updates are passed to the existing chart
    (otherwise they are recreated on update).
    The `type` option must be a registered `d3.chart` and all other options are passed to the component.

    @example
    ```js
    chart.components([
      {id: 'axis.y', type: 'Axis'}, // options to pass to Axis component
      {id: 'title', type: 'Title'} // options to pass to Title component
    ])
    ```
    @property components
    @type Array
  */
  components: property({
    set: function(component_options, components) {
      // Store actual components rather than options
      return {
        override: this._attachItems(component_options, components, this)
      };
    },
    default_value: []
  }),

  /**
    Delay start of transition by specified milliseconds.
    (applied to all charts and components as default)

    @property delay
    @type Number|Function
    @default d3 default: 0
  */
  delay: property(),

  /**
    Transition duration in milliseconds.
    (applied to all charts and components as default)

    @property duration
    @type Number|Function
    @default d3 default: 250ms
  */
  duration: property(),

  /**
    Transition ease function.
    (applied to all charts and components as default)

    - See: [Transitions#ease](https://github.com/mbostock/d3/wiki/Transitions#ease)
    - Note: arguments to pass to `d3.ease` are not supported

    @property ease
    @type String|Function
    @default d3 default: 'cubic-in-out'
  */
  ease: property(),

  /**
    Draw chart with given data

    @example
    ```js
    var chart = d3.select('#chart')
      .chart('Compose', function(data) {
        // ...
      });

    chart.draw([1, 2, 3]);

    chart.draw({values: [1, 2, 3]});

    chart.draw([
      {values: [1, 2, 3]},
      {values: [4, 5, 6]}
    ]);
    ```
    @method draw
    @param {Any} data
  */
  draw: function(data) {
    var config = this._prepareConfig(this.options(), data);
    if (!config)
      config = {data: {_charts: {}, _components: {}}, layout: []};

    // Set charts and components from config
    this.charts(config.charts);
    this.components(config.components);

    // Add config data
    data = {
      original: data,
      config: config.data
    };
    this.data(data);

    this._setDimensions();

    // Layout components
    this.layout(config.layout, data);

    // Full draw now that everything has been laid out
    d3.chart().prototype.draw.call(this, data);
  },

  /**
    Redraw chart with current data

    @method redraw
  */
  redraw: function() {
    if (this.rawData())
      this.draw(this.rawData().original);
  },

  demux: function(name, data) {
    if (!data || !data.config || !data.original)
      return data;

    if (findById(this.charts(), name) && data.config._charts[name])
      return data.config._charts[name];
    else if (findById(this.components(), name) && data.config._components[name])
      return data.config._components[name];
    else
      return data.original;
  },

  // Create chart layer (for laying out charts)
  createChartLayer: function(options) {
    return this.base.append('g')
      .attr('class', 'chart-layer')
      .attr('data-zIndex', options && options.z_index);
  },

  // Create component layer
  createComponentLayer: function(options) {
    return this.base.append('g')
      .attr('class', 'chart-component-layer')
      .attr('data-zIndex', options && options.z_index);
  },

  // Create overlay layer
  createOverlayLayer: function() {
    if (!this.container)
      throw new Error('Cannot create overlay layer if original selection "d3.select(...).chart(\'Compose\')" is an svg. Use a div instead for responsive and overlay support.');

    return this.container.append('div')
      .attr('class', 'chart-overlay-layer');
  },

  // Layout components and charts for given data
  layout: function(layout, data) {
    // 1. Place chart layers
    this._positionChartLayers();

    // 2. Extract layout from components
    layout = this._extractLayout(data);

    // 3. Set chart position from layout
    var chart_position = extend({}, this.margins());
    objectEach(layout, function(parts, key) {
      parts.forEach(function(part) {
        chart_position[key] += part.offset || 0;
      });
    });
    this.chartPosition(chart_position);

    // 4. Position layers with layout
    this.positionLayers(layout);
  },

  attachHoverListeners: function() {
    // For responsive, listen on container div and calculate enter/exit for base from bounding rectangle
    // For non-responsive, bounding rectangle is container so calculations still apply

    var trigger = this.trigger.bind(this);
    var chartPosition = this.chartPosition.bind(this);
    var container = this.container || this.base;
    var base = this.base.node();
    var chart_position, bounds, was_inside;

    container.on('mouseenter', function() {
      // Calculate chart position and bounds on enter and cache during move
      chart_position = chartPosition();
      bounds = getBounds();

      was_inside = inside(bounds);
      if (was_inside)
        enter();
    });
    container.on('mousemove', function() {
      // Mousemove may fire before mouseenter in IE
      if (!chart_position || !bounds) {
        chart_position = chartPosition();
        bounds = getBounds();
      }

      var is_inside = inside(bounds);
      if (was_inside && is_inside)
        move();
      else if (was_inside)
        leave();
      else if (is_inside)
        enter();

      was_inside = is_inside;
    });
    container.on('mouseleave', function() {
      if (was_inside) {
        was_inside = false;
        leave();
      }
    });

    function inside() {
      var mouse = d3.mouse(document.documentElement);
      return mouse[0] >= bounds.left && mouse[0] <= bounds.right && mouse[1] >= bounds.top && mouse[1] <= bounds.bottom;
    }
    function enter() {
      trigger('mouseenter', translateToXY(d3.mouse(base)));
    }
    function move() {
      trigger('mousemove', translateToXY(d3.mouse(base)));
    }
    function leave() {
      trigger('mouseleave');
    }

    function translateToXY(coordinates) {
      var x = coordinates[0];
      var y = coordinates[1];
      var chart_x = x - chart_position.left;
      var chart_y = y - chart_position.top;

      // Set at chart bounds if outside of chart
      if (x > (chart_position.left + chart_position.width))
        chart_x = chart_position.width;
      else if (x < chart_position.left)
        chart_x = 0;

      if (y > (chart_position.top + chart_position.height))
        chart_y = chart_position.height;
      else if (y < chart_position.top)
        chart_y = 0;

      return {
        container: {x: x, y: y},
        chart: {x: chart_x, y: chart_y}
      };
    }

    function getBounds() {
      var scroll_y = 'scrollY' in window ? window.scrollY : document.documentElement.scrollTop;

      bounds = extend({}, base.getBoundingClientRect());
      bounds.top += scroll_y;
      bounds.bottom += scroll_y;

      return bounds;
    }
  },

  // Attach chart/component child item with id
  attach: function(id, item) {
    item.id = id;
    item.base.attr('data-id', id);
    item.container = this;

    Base.prototype.attach.call(this, id, item);

    if (item && isFunction(item.trigger))
      item.trigger('attach');
  },

  // Detach chart/component child item by id
  detach: function(id, item) {
    item.base.remove();

    delete this._attached[id];

    if (item && isFunction(item.trigger))
      item.trigger('detach');
  },

  // Position chart and component layers
  positionLayers: function(layout) {
    this._positionChartLayers();
    this._positionComponents(layout);
    this._positionByZIndex();
  },

  //
  // Internal
  //

  _setDimensions: function() {
    // Set container and svg dimensions
    // (if original selection is svg, no container and skip responsiveness)
    if (this.container) {
      this.container
        .attr('style', this.containerStyle());
    }

    this.base
      .attr('viewBox', this.viewBox())
      .attr('preserveAspectRatio', this.preserveAspectRatio())
      .attr('style', this.baseStyle())
      .attr('width', this.responsive() ? null : this.width())
      .attr('height', this.responsive() ? null : this.height());
  },

  _attachItems: function(items, container, context) {
    items = items || [];
    container = container || [];

    // Remove charts that are no longer needed
    var remove_ids = difference(pluck(container, 'id'), pluck(items, 'id'));
    remove_ids.forEach(function(remove_id) {
      context.detach(remove_id, findById(container, remove_id));
    });

    // Create or update charts
    return items.map(function(options) {
      // TODO May not have id, might need to auto-generate
      // (might be during another step)
      var id = options.id;
      var item = findById(container, id);

      if (options instanceof d3.chart()) {
        // If chart instance, replace with instance
        if (item)
          context.detach(id, item);

        context.attach(id, options);
        return options;
      }
      else {
        // TEMP Changing position has nasty side effects, disable for now
        var changed_position = item && !(item instanceof Overlay) && item.position && options.position && item.position() != options.position;

        if (item && (item.type != options.type || changed_position)) {
          // If chart type has changed, detach and re-create
          context.detach(id, item);
          item = undefined;
        }

        if (!item) {
          var Item = d3.chart(options.type);

          if (!Item)
            throw new Error('No registered d3.chart found for ' + options.type);

          var layer_options = {z_index: Item.z_index || 0};
          var createLayer = {
            'chart': 'createChartLayer',
            'component': 'createComponentLayer',
            'overlay': 'createOverlayLayer'
          }[Item.layer_type];

          if (!createLayer)
            throw new Error('Unrecognized layer type "' + Item.layer_type + '" for ' + options.type);

          var base = context[createLayer](layer_options);

          item = new Item(base, options);
          item.type = options.type;

          context.attach(id, item);
        }
        else {
          item.options(options);
        }

        return item;
      }
    });
  },

  _prepareConfig: function(options, data) {
    return extractLayout(options(data));
  },

  _positionChartLayers: function() {
    var position = this.chartPosition();
    this.base.selectAll('.chart-layer')
      .attr('transform', translate(position.left, position.top))
      .attr('width', position.width)
      .attr('height', position.height);
  },

  _positionComponents: function(layout) {
    var chart_position = this.chartPosition();
    var width = this._width();
    var height = this._height();

    applyLayout(layout, chart_position, width, height);
  },

  _positionByZIndex: function() {
    var layers = this.base.selectAll('.chart-layer, .chart-component-layer')[0];

    // Sort by z-index
    function setZIndex(layer) {
      return {
        layer: layer,
        zIndex: parseInt(d3.select(layer).attr('data-zIndex')) || 0
      };
    }
    function sortZIndex(a, b) {
      if (a.zIndex < b.zIndex)
        return -1;
      else if (a.zIndex > b.zIndex)
        return 1;
      else
        return 0;
    }
    function getLayer(wrapped) {
      return wrapped.layer;
    }

    layers = layers.map(setZIndex).sort(sortZIndex).map(getLayer);

    // Move layers to z-index order
    layers.forEach(function(layer) {
      if (layer && layer.parentNode && layer.parentNode.appendChild)
        layer.parentNode.appendChild(layer);
    });
  },

  _extractLayout: function(data) {
    return calculateLayout(this.components(), data, this.demux.bind(this));
  }
});

// TODO Find better place for this
function layered(items) {
  if (!Array.isArray(items))
    items = Array.prototype.slice.call(arguments);

  return {_layered: true, items: items};
}

function findById(items, id) {
  return find(items, function(item) {
    return item.id == id;
  });
}

d3.chart().Compose = Compose;
export {
  Compose as default,
  layered
};

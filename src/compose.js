import d3 from 'd3';
import {
  assign,
  difference,
  objectEach
} from './utils';
import {
  getLayer,
  getTranslate,
  types
} from './helpers';
import {Chart} from './chart';
import {
  prepareDescription,
  calculateLayout,
  extractLayout
} from './layout';

var selectionError = 'svg is not supported for the base selection'

var Compose = Chart.extend({
  constructor: function Compose(base, props) {
    Chart.call(this, base, props);
    this.children = {byId: {}, ordered: []};
    this.baseNode = this.base.node();

    // Need div, p, etc. to support div layers (e.g. Overlay)
    if (this.baseNode.tagName == 'svg') {
      throw new Error(selectionError);
    }

    // Responsive svg based on the following approach (embedded + padding hack)
    // http://tympanus.net/codrops/2014/08/19/making-svgs-responsive-with-css/
    this.container = this.base.append('div')
      .attr('class', 'd3c-container')
      .style({position: 'relative'});
    this.svg = this.container.append('svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('version', '1.1')
      .attr('class', 'd3c-svg');

    // Attach mouse event source
    var transform = this.getRelativePoint.bind(this);
    this.unsubscribe = {
      mouse: mouseSource(this.container, {transform: transform}, function() {
        // TODO
      })
    };
  },

  render: function render() {
    // 1. Size and style container/svg
    var dimensions = this.getDimensions();
    this.prepareContainer(dimensions)

    // 2. Prepare children
    var description = this.props.description || [];
    var prepared = prepareDescription(description);
    this.prepareChildren(prepared, dimensions);

    // 3. Extract and calculate layout
    var extracted = this.extractLayoutFromPrepared(prepared);
    var layout = calculateLayout(extracted, dimensions);

    // 4. Apply calculated layout
    this.applyLayout(prepared, layout, dimensions);

    // 5. Render children
    objectEach(this.children.byId, function(child) { child.render(); });
  },

  draw: function draw(description) {
    this.props = assign({}, this.props, {description: description});
    this.render();
  },

  prepareChildren: function prepareChildren(prepared, dimensions) {
    // Remove no longer existing children
    var current = this.children.byId;
    var removed = difference(this.children.ordered, prepared.ordered);
    removed.forEach(function(id) { current[id].remove(); });

    var byId = {};
    prepared.ordered.forEach(function(id) {
      var props = prepared.byId[id].props;
      var type = prepared.byId[id].type;

      // For layout, override with default layout
      var withLayout = assign({}, props, {
        top: 0,
        right: dimensions.width,
        bottom: dimensions.height,
        left: 0,
        width: dimensions.width,
        height: dimensions.height
      });

      var child = current[id];
      if (child && child._type !== type) {
        child.remove();
        child = undefined;
      }

      if (child) {
        child.setProps(withLayout);
      } else {
        var layer = type.layerType == 'div' ? getLayer(this.container, id, 'div') : getLayer(this.svg, id);

        child = new type(layer, withLayout, this);
        child._id = id;
        child._type = type;
      }

      byId[id] = child;
    }, this);

    this.children = {byId: byId, ordered: prepared.ordered};
  },

  extractLayoutFromPrepared: function extractLayoutFromPrepared(prepared) {
    var byId = this.children.byId;
    return this.children.ordered.map(function(_id) {
      var child = byId[_id];
      var layout = extractLayout(prepared.byId[_id].props);
      var preparedLayout = child.prepareLayout(layout);
      return assign({_id: _id}, preparedLayout);
    });
  },

  applyLayout: function applyLayout(prepared, layout, dimensions) {
    var scale = dimensions.scale;
    var byId = this.children.byId;
    objectEach(layout.byId, function(values, _id) {
      var child = byId[_id];
      var props = assign({}, prepared.byId[_id].props, values);
      child.setProps(props);

      var x = values.x + values.margin.left;
      var y = values.y + values.margin.top;

      if (child.constructor && child.constructor.layerType == 'div') {
        var translate = getTranslate((x * scale) + 'px', (y * scale) + 'px');
        var transform = translate + ' scale(' + scale + ',' + scale + ')';

        child.base.style({
          position: 'absolute',
          top: 0,
          left: 0,
          transform: transform,
          '-ms-transform': transform,
          '-webkit-transform': transform
        });
      } else {
        child.base.attr('transform', getTranslate(x, y));
      }
    });
  },

  getScale: function getScale() {
    return this.props.responsive && this.props.width ? this.baseNode.clientWidth / this.props.width : 1.0;
  },

  getDimensions: function getDimensions() {
    var width = this.props.width;
    var height = this.props.height;
    var aspectRatio = this.props.aspectRatio;

    if (width && height) {
      aspectRatio = width / height;
    } else if (width) {
      height = width / aspectRatio;
    } else {
      width = this.baseNode.clientWidth;
      height = width / aspectRatio;
    }

    return {width: width, height: height, aspectRatio: aspectRatio, scale: this.getScale()};
  },

  getRelativePoint: function(point) {
    var scale = this.getScale();
    return {
      x: point[0] * 1/scale,
      y: point[1] * 1/scale
    };
  },

  prepareContainer: function prepareContainer(dimensions) {
    // - Use given width/height or base clientWidth and aspect ratio
    // - For non-responsive, set static width/height
    // - For responsive, set container to 100% and viewBox width/height

    var width = dimensions.width;
    var height = dimensions.height;
    var aspectRatio = dimensions.aspectRatio;

    if (this.props.responsive) {
      // Responsive svg based on the following approach (embedded + padding hack)
      // http://tympanus.net/codrops/2014/08/19/making-svgs-responsive-with-css/
      this.container
        .style({
          width: '100%',
          height: 0,
          'padding-top': (1/aspectRatio * 100) + '%',
          position: 'relative'
        });
      this.svg
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style({
          position: 'absolute',
          top: 0,
          left: 0
        });
    } else {
      this.container
        .style({
          width: width + 'px',
          height: height + 'px'
        });
      this.svg
        .attr('width', width)
        .attr('height', height);
    }
  }
});

Compose.properties = {
  responsive: {
    type: types.boolean,
    getDefault: function() { return true; }
  },
  width: types.number,
  height: types.number,
  aspectRatio: {
    type: types.number,
    getDefault: function() { return 3/2; }
  }
};

export default Compose;

/*
  mouseSource

  @param {d3.selection} container
  @param {Object} [options]
  @param {Function} [options.transform]
  @param {Function} fn
*/
var sourceId = 0;
export function mouseSource(container, options, fn) {
  if (!fn) {
    fn = options;
    options = undefined;
  }

  var namespace = '__mouse-' + (sourceId++);
  var transform = options && options.transform || function(position) { return position; };

  container.on('mouseenter.' + namespace, function() {
    fn({type: 'mouseenter', position: transform(d3.mouse(this))});
  });
  container.on('mouseover.' + namespace, function() {
    fn({type: 'mouseover', position: transform(d3.mouse(this))});
  });
  container.on('mousemove.' + namespace, function() {
    fn({type: 'mousemove', position: transform(d3.mouse(this))});
  });
  container.on('mouseout.' + namespace, function() {
    fn({type: 'mouseout'});
  });
  container.on('mouseleave.' + namespace, function() {
    fn({type: 'mouseleave'});
  });

  return function unsubscribe() {
    container.on('.' + namespace, null);
  };
}

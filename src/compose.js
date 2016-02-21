import d3 from 'd3';
import {
  assign,
  difference,
  extend,
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

    // Need div, p, etc. to support div layers (e.g. Overlay)
    if (this.base.node().tagName == 'svg') {
      throw new Error(selectionError);
    }

    // Responsive svg based on the following approach (embedded + padding hack)
    // http://tympanus.net/codrops/2014/08/19/making-svgs-responsive-with-css/
    this.container = this.base.append('div')
      .attr('class', 'd3c-container')
      .style({position: 'relative'});
    this.svg = this.container.append('svg')
      .attr('xlmns', 'http://www.w3.org/2000/svg')
      .attr('version', '1.1')
      .attr('class', 'd3c-svg');

    // Setup events source
    var subscriptions = this.subscriptions = [];
    this.events = {
      subscribe: function subscribe(listener) {
        subscriptions.push(listener);

        return function unsubscribe() {
          var index = subscriptions.indexOf(listener);
          subscriptions.splice(index, 1);
        }
      }
    };

    // Attach mouse event source
    this.attachMouseEvents();
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

  getDimensions: function getDimensions() {
    var responsive = this.props.responsive;
    var width = this.props.width;
    var height = this.props.height;
    var aspectRatio = this.props.aspectRatio;
    var clientWidth = this.base.node().clientWidth;
    if (width && height) {
      aspectRatio = width / height;
    } else if (width) {
      height = width / aspectRatio;
    } else {
      width = clientWidth;
      height = width / aspectRatio;
    }
    var scale = responsive ? clientWidth / width : 1.0;

    return {width: width, height: height, aspectRatio: aspectRatio, scale: scale};
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
  },

  attachMouseEvents: function attachMouseEvents() {
    var base = this.base.node();
    var container = this.container.node();
    var subscriptions = this.subscriptions;

    // TODO Update to respond to changes in responsive/width
    var responsive = this.props.responsive;
    var width = this.props.width;
    var scale = 1.0;
    var bounds, wasInside;

    this.container.on('mouseenter', function() {
      calculateBounds();
      wasInside = getInside(bounds);

      if (wasInside) {
        mouseEnter();
      }
    });
    this.container.on('mousemove', function() {
      // Mousemove may fire before mouseenter in IE
      if (!bounds) {
        calculateBounds();
        wasInside = false;
      }

      var isInside = getInside(bounds);
      if (wasInside && isInside) {
        mouseMove();
      } else if (wasInside) {
        mouseLeave();
      } else {
        mouseEnter();
      }

      wasInside = isInside;
    });
    this.container.on('mouseleave', function() {
      if (wasInside) {
        wasInside = false;
        mouseLeave();
      }
    });

    function mouseEnter() {
      publish(subscriptions, {type: 'mouseenter', coordinates: getCoordinates(container, scale)});
    }
    function mouseMove() {
      publish(subscriptions, {type: 'mousemove', coordinates: getCoordinates(container, scale)});
    }
    function mouseLeave() {
      publish(subscriptions, {type: 'mouseleave'});
    }

    function calculateBounds() {
      if (responsive && width) {
        scale = base.clientWidth / width;
      }
      bounds = getBounds(container, scale);
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

function publish(subscriptions, event) {
  for (var i = 0, length = subscriptions.length; i < length; i++) {
    subscriptions[i](event);
  }
}

function getCoordinates(container, scale) {
  var mouse = d3.mouse(container);
  var x = mouse[0];
  var y = mouse[1];

  // Scale to svg dimensions
  var coordinates = {
    x: x * (1/scale),
    y: y * (1/scale)
  };

  return coordinates;
}

function getBounds(container) {
  // Get bounds of container relative to document
  var scrollY = 'scrollY' in window ? window.scrollY : document.documentElement.scrollTop;
  var bounds = extend({}, container.getBoundingClientRect());
  bounds.top += scrollY;
  bounds.bottom += scrollY;

  return bounds;
}

function getInside(bounds) {
  // Check if the current mouse position is within the container bounds
  var mouse = d3.mouse(document.documentElement);
  var x = mouse[0];
  var y = mouse[1];
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
}

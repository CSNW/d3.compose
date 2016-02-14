import d3 from 'd3';
import {
  assign,
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

const selectionError = 'svg is not supported for the base selection'

const Compose = Chart.extend({
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
    const subscriptions = this.subscriptions = [];
    this.events = {
      subscribe(listener) {
        subscriptions.push(listener);

        return function unsubscribe() {
          const index = subscriptions.indexOf(listener);
          subscriptions.splice(index, 1);
        }
      }
    };

    // Attach mouse event source
    this.attachMouseEvents();
  },

  render() {
    // 1. Size and style container/svg
    const dimensions = this.getDimensions();
    this.prepareContainer(dimensions)

    // 2. Prepare children
    const description = this.props.description || [];
    const prepared = prepareDescription(description);
    this.prepareChildren(prepared, dimensions);

    // 3. Extract and calculate layout
    const extracted = this.extractLayout(prepared);
    const layout = calculateLayout(extracted, dimensions);

    // 4. Apply calculated layout
    this.applyLayout(prepared, layout, dimensions);

    // 5. Render children
    objectEach(this.children.byId, child => child.render());
  },

  draw(description) {
    this.props = assign({}, this.props, {description});
    this.render();
  },

  prepareChildren(prepared, dimensions) {
    // TODO Patch existing children by id
    objectEach(this.children.byId, child => child.remove());

    const byId = {};
    prepared.ordered.forEach(_id => {
      const {props, type} = prepared.byId[_id];

      // For layout, override with default layout
      const withLayout = assign({}, props, {
        top: 0,
        right: dimensions.width,
        bottom: dimensions.height,
        left: 0,
        width: dimensions.width,
        height: dimensions.height
      });

      var child;
      if (type.layerType == 'div') {
        child = new type(getLayer(this.container, _id, type.layerType), withLayout, this);
      } else {
        child = new type(getLayer(this.svg, _id), withLayout, this);
      }
      child._id = _id;

      byId[_id] = child;
    });

    this.children = {byId, ordered: prepared.ordered};
  },

  extractLayout(prepared) {
    const byId = this.children.byId;
    return this.children.ordered.map(_id => {
      const child = byId[_id];
      const layout = extractLayout(prepared.byId[_id].props);
      return assign({_id}, child.prepareLayout(layout));
    });
  },

  applyLayout(prepared, layout, {scale}) {
    const byId = this.children.byId;
    objectEach(layout.byId, (values, _id) => {
      const child = byId[_id];
      const props = assign({}, prepared.byId[_id].props, values);
      child.setProps(props);

      const x = values.x + values.margin.left;
      const y = values.y + values.margin.top;

      if (child.constructor && child.constructor.layerType == 'div') {
        const translate = getTranslate((x * scale) + 'px', (y * scale) + 'px');
        const transform = `${translate} scale(${scale},${scale})`;

        child.base.style({
          position: 'absolute',
          top: 0,
          left: 0,
          transform,
          '-ms-transform': transform,
          '-webkit-transform': transform
        });
      } else {
        child.base.attr('transform', getTranslate(x, y));
      }
    });
  },

  getDimensions() {
    const {responsive} = this.props;
    var {width, height, aspectRatio} = this.props;
    const clientWidth = this.base.node().clientWidth;
    if (width && height) {
      aspectRatio = width / height;
    } else if (width) {
      height = width / aspectRatio;
    } else {
      width = clientWidth;
      height = width / aspectRatio;
    }
    const scale = responsive ? clientWidth / width : 1.0;

    return {width, height, aspectRatio, scale};
  },

  prepareContainer({width, height, aspectRatio, scale}) {
    // - Use given width/height or base clientWidth and aspect ratio
    // - For non-responsive, set static width/height
    // - For responsive, set container to 100% and viewBox width/height

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
        .attr('viewBox', `0 0 ${width} ${height}`)
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

  attachMouseEvents() {
    const base = this.base.node();
    const container = this.container.node();
    const subscriptions = this.subscriptions;

    // TODO Update to respond to changes in responsive/width
    var {responsive, width} = this.props;
    var scale = 1.0;
    var bounds, wasInside;

    this.container.on('mouseenter', () => {
      calculateBounds();
      wasInside = getInside(bounds);

      if (wasInside) {
        mouseEnter();
      }
    });
    this.container.on('mousemove', () => {
      // Mousemove may fire before mouseenter in IE
      if (!bounds) {
        calculateBounds();
        wasInside = false;
      }

      const isInside = getInside(bounds);
      if (wasInside && isInside) {
        mouseMove();
      } else if (wasInside) {
        mouseLeave();
      } else {
        mouseEnter();
      }

      wasInside = isInside;
    });
    this.container.on('mouseleave', () => {
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
    getDefault: () => true
  },
  width: types.number,
  height: types.number,
  aspectRatio: {
    type: types.number,
    getDefault: () => 3/2
  }
};

export default Compose;

function publish(subscriptions, event) {
  for (var i = 0, length = subscriptions.length; i < length; i++) {
    subscriptions[i](event);
  }
}

function getCoordinates(container, scale) {
  const mouse = d3.mouse(container);
  const x = mouse[0];
  const y = mouse[1];

  // Scale to svg dimensions
  const coordinates = {
    x: x * (1/scale),
    y: y * (1/scale)
  };

  return coordinates;
}

function getBounds(container) {
  // Get bounds of container relative to document
  const scrollY = 'scrollY' in window ? window.scrollY : document.documentElement.scrollTop;
  const bounds = extend({}, container.getBoundingClientRect());
  bounds.top += scrollY;
  bounds.bottom += scrollY;

  return bounds;
}

function getInside(bounds) {
  // Check if the current mouse position is within the container bounds
  const mouse = d3.mouse(document.documentElement);
  const x = mouse[0];
  const y = mouse[1];
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
}

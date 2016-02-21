import {
  assign,
  inherits,
  objectEach,
  isObject,
  isUndefined
} from './utils';
import {
  checkProp,
  createChart,
  isChart,
  types
} from './helpers';
import {constraint} from './layout';

var defaultProps = {};
var defaultMargin = {top: 0, right: 0, bottom: 0, left: 0};

export function Chart(selection, props, context) {
  this.base = selection;
  this.context = context;
  this.setProps(props);
}

assign(Chart.prototype, {
  setProps: function setProps(props) {
    props = props || defaultProps;
    var properties = this.constructor && this.constructor.properties;
    if (!properties) {
      this.props = props;
      return;
    }

    // Get defaults and check props
    var loaded = assign({}, props);
    objectEach(properties, function(definition, key) {
      var prop = loaded[key];

      if (!isUndefined(prop)) {
        // TODO Skip in production
        checkProp(prop, definition);
      } else if (definition.getDefault) {
        loaded[key] = definition.getDefault.call(this, props);
      }
    });

    this.props = loaded;
  },

  prepareLayout: function prepareLayout(layout) {
    var width = layout.width;
    var height = layout.height;
    var margin = layout.margin;

    // Load width/height (if necessary)
    if (isUndefined(width) || isUndefined(height)) {
      var dimensions = this.getDimensions();
      if (isUndefined(width)) {
        width = dimensions.width;
      }
      if (isUndefined(height)) {
        height = dimensions.height;
      }
    }

    // Load default margins
    if (!isUndefined(margin) && !isObject(margin)) {
      margin = {top: margin, right: margin, bottom: margin, left: margin};
    } else {
      margin = assign({}, this.getMargin(), margin);
    }

    return assign({}, layout, {width: width, height: height, margin: margin});
  },

  getDimensions: function() {
    return {
      width: constraint.flex(),
      height: constraint.flex()
    };
  },

  getMargin: function getMargin() {
    return defaultMargin;
  },

  render: function render() {

  },

  remove: function remove() {

  }
});

assign(Chart, {
  properties: {
    top: types.any,
    right: types.any,
    bottom: types.any,
    left: types.any,
    width: types.any,
    height: types.any,
    margin: types.any,
    zIndex: types.any
  },
  layerType: 'g',

  extend: function extend(protoProps, staticProps) {
    var Parent = this;
    var Child;

    if (protoProps && protoProps.hasOwnProperty('constructor')) {
      Child = protoProps.constructor;

      // inherits sets constructor, remove from protoProps
      protoProps = assign({}, protoProps);
      delete protoProps.constructor;
    } else {
      Child = function() { return Parent.apply(this, arguments); };
    }

    inherits(Child, Parent);

    if (staticProps) {
      assign(Child, staticProps);
    }
    if (protoProps) {
      assign(Child.prototype, protoProps);
    }

    return Child;
  }
});

export default function chart(Type) {
  if (!isChart(Type)) {
    Type = createChart(Type, Chart);
  }

  return function(id, props) {
    if (!props) {
      props = id;
      id = undefined;
    }

    return {type: Type, id: id, props: props};
  };
}

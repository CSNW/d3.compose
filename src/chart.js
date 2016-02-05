import {
  assign,
  inherits,
  objectEach,
  isUndefined
} from './utils';
import {
  checkProp,
  createChart,
  getDimensions,
  isChart,
  types
} from './helpers';

const defaultProps = {};

export function Chart(selection, props) {
  this.base = selection;
  this.setProps(props);
}

assign(Chart.prototype, {
  setProps(props = defaultProps) {
    const properties = this.constructor && this.constructor.properties;
    if (!properties) {
      this.props = props;
      return;
    }

    // Get defaults and check props
    const loaded = assign({}, props);
    objectEach(properties, (definition, key) => {
      const prop = loaded[key];

      if (!isUndefined(prop)) {
        // TODO Skip in production
        checkProp(prop, definition);
      } else if (definition.getDefault) {
        loaded[key] = definition.getDefault.call(this, props);
      }
    });

    // TODO Add during layout
    const dimensions = getDimensions(this.base);
    this.props = assign({}, dimensions, loaded);
  },

  getLayout() {
    // TODO Defaults
    const {
      top,
      right,
      bottom,
      left,
      width,
      height,
      margin
    } = this.props;

    return {top, right, bottom, left, width, height, margin};
  },

  render() {

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
    margin: types.any
  },

  extend(protoProps, staticProps) {
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
    Type = createChart(Type);
  }

  return (id, props) => {
    if (!props) {
      props = id;
      id = undefined;
    }

    return {type: Type, id, props};
  };
}

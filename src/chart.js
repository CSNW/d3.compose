import {assign, inherits, objectEach, isUndefined} from './utils';
import {checkProp} from './helpers';

const defaultProps = {};

export function Chart(selection, props) {
  this.base = selection;
  this.setProps(props);
}

assign(Chart.prototype, {
  setProps(props) {
    const properties = this.constructor && this.constructor.properties;
    if (!properties) {
      this.props = props;
      return;
    }

    // Get defaults and check props
    const loaded = assign({}, props);
    objectEach(properties, (definition, key) => {
      const prop = loaded[key];

      if (!isUndefined(prop))
        checkProp(prop, definition);
      else if (definition.getDefault)
        loaded[key] = definition.getDefault.call(this, props);
    });

    this.props = loaded;
  },

  render() {

  }
});

assign(Chart, {
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
  return (id, props) => {
    if (!props) {
      props = id;
      id = undefined;
    }

    return {type: Type, id, props};
  };
}

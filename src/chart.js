import {assign, inherits} from './utils';

export function Chart(selection, props) {

}

assign(Chart.prototype, {
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
    }
    else {
      Child = function() { return Parent.apply(this, arguments); };
    }

    inherits(Child, Parent);

    if (staticProps)
      assign(Child, staticProps);
    if (protoProps)
      assign(Child.prototype, protoProps);

    return Child;
  }
});

export default function chart() {

}

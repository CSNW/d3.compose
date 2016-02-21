import {
  getDimensions,
  isChart,
  createChart
} from './helpers';
import {Chart} from './chart';

var Component = Chart.extend({
  getDimensions: function() {
    this.render();
    return getDimensions(this.base);
  }
});

function component(Type) {
  if (!isChart(Type)) {
    Type = createChart(Type, Component);
  }

  return function(id, props) {
    if (!props) {
      props = id;
      id = undefined;
    }

    return {type: Type, id: id, props: props};
  };
}

export {
  Component,
  component as default
};

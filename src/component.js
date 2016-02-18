import {
  getDimensions as getSelectionDimensions,
  isChart,
  createChart
} from './helpers';
import {Chart} from './chart';

var Component = Chart.extend({
  getDimensions: function getDimensions() {
    this.render();
    return getSelectionDimensions(this.base);
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

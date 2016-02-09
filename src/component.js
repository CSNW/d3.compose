import {
  getDimensions,
  isChart,
  createChart
} from './helpers';
import {Chart} from './chart';

const Component = Chart.extend({
  getDimensions() {
    this.render();
    return getDimensions(this.base);
  }
});

function component(Type) {
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

export {
  Component,
  component as default
};

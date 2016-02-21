import {
  createChart,
  isChart
} from './helpers';
import {Component} from './component';

export var Overlay = Component.extend({

});

Overlay.layerType = 'div';

export default function overlay(Type) {
  if (!isChart(Type)) {
    Type = createChart(Type, Overlay);
  }

  return function(id, props) {
    if (!props) {
      props = id;
      id = undefined;
    }

    return {type: Type, id: id, props: props};
  };
}

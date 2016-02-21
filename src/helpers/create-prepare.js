import {toArray} from '../utils';

export default function createPrepare() {
  var steps = toArray(arguments);
  return function prepare(selection, props) {
    return steps.reduce(function(memo, step) {
      return step(selection, memo);
    }, props);
  };
}

import {toArray} from '../utils';

export default function createPrepare() {
  const steps = toArray(arguments);
  return (selection, props) => {
    return steps.reduce((memo, step) => {
      return step(selection, memo);
    }, props);
  };
}

import {curry} from '../utils';

export default function createDraw(steps) {
  return (selection, props) => {
    const {
      select,
      enter,
      update,
      merge,
      exit
    } = prepareSteps(steps, props);

    const selected = select.call(selection);
    selected.exit().call(exit);
    selected.call(update);
    selected.enter().call(enter);
    selected.call(merge);
  };
}

export function prepareSteps(steps, props) {
  const {
    select = function() { return this; },
    enter = () => {},
    update = () => {},
    merge = () => {},
    exit = function() { this.remove(); }
  } = steps;

  return {
    select: curry(select, props),
    enter: curry(enter, props),
    update: curry(update, props),
    merge: curry(merge, props),
    exit: curry(exit, props)
  };
}

import {curry} from '../utils';

const selectError = `d3.compose: select did not return a properly joined / data-bound selection

Example: createDraw({
  select: function(props) {
    return this.selectAll('rect').data(props.data, props.key);
    //          ^ join elements   ^ to data
    //   ^ return joined / data-bound selection
  }
});`

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

    if (!selected || !selected.exit)
      throw new Error(selectError);

    selected.exit().call(exit);
    selected.call(update);
    selected.enter().call(enter);
    selected.call(merge);
  };
}

export function prepareSteps(steps, props) {
  const {
    select,
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

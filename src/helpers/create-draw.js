import {curry} from '../utils';

const selectExample = `
Example: createDraw({
  select: function(props) {
    return this.selectAll('rect').data(props.data, props.key);
    //          ^ join elements   ^ to data
    //   ^ return joined / data-bound selection
  }
});`

const selectRequired = `d3.compose: select is a required step for createDraw
${selectExample}`;

const selectReturn = `d3.compose: select did not return a properly joined / data-bound selection
${selectExample}`;

export default function createDraw(steps) {
  if (!steps.select)
    throw new Error(selectRequired);

  return (selection, props) => {
    const {
      select,
      enter,
      update,
      merge,
      exit
    } = prepareSteps(steps, selection, props);

    const selected = select.call(selection);

    if (!selected || !selected.exit)
      throw new Error(selectReturn);

    selected.exit().call(exit);
    selected.call(update);
    selected.enter().call(enter);
    selected.call(merge);
  };
}

export function prepareSteps(steps, selection, props) {
  const {
    prepare = (selection, props) => props,
    select,
    enter = () => {},
    update = () => {},
    merge = () => {},
    exit = function() { this.remove(); }
  } = steps;

  props = prepare(selection, props);

  return {
    select: curry(select, props),
    enter: curry(enter, props),
    update: curry(update, props),
    merge: curry(merge, props),
    exit: curry(exit, props)
  };
}

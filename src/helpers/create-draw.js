import {curry} from '../utils';

var selectExample = '' +
'Example: createDraw({\n' +
'  select: function(props) {\n' +
'    return this.selectAll(\'rect\').data(props.data, props.key);\n' +
'    //          ^ join elements   ^ to data\n' +
'    //   ^ return joined / data-bound selection\n' +
'  }\n' +
'});'
var selectRequired = 'd3.compose: select is a required step for createDraw\n' + selectExample;
var selectReturn = 'd3.compose: select did not return a properly joined / data-bound selection\n' + selectExample;

export default function createDraw(steps) {
  if (!steps.select) {
    throw new Error(selectRequired);
  }

  return function draw(selection, props) {
    var prepared = prepareSteps(steps, selection, props);
    var selected = prepared.select.call(selection);

    if (!selected || !selected.exit) {
      throw new Error(selectReturn);
    }

    selected.exit().call(prepared.exit);
    selected.call(prepared.update);
    selected.enter().call(prepared.enter);
    selected.call(prepared.merge);
  };
}

export function prepareSteps(steps, selection, props) {
  var prepare = steps.prepare || function(selection, props) { return props; };
  var select = steps.select;
  var enter = steps.enter || function() {};
  var update = steps.update || function() {};
  var merge = steps.merge || function() {};
  var exit = steps.exit || function() { this.remove(); };

  props = prepare(selection, props);

  return {
    select: curry(select, props),
    enter: curry(enter, props),
    update: curry(update, props),
    merge: curry(merge, props),
    exit: curry(exit, props)
  };
}

import {createDraw, types} from '../helpers';
import component from '../component';

export const Title = createDraw({
  select,
  enter,
  update,
  merge,
  exit
});

Title.properties = {
  text: types.string
};

export default const bars = component(Bars);

export function select(props) {

}
export function enter(props) {

}
export function update(props) {

}
export function merge(props) {

}
export function exit(props) {

}

import {createSeriesDraw, types, connect} from '../helpers';
import chart from '../chart';

export const Bars = createSeriesDraw({
  select,
  enter,
  update,
  merge,
  exit
});

Bars.properties = {
  offset: {
    type: types.number,
    getDefault: () => 0
  }
};

export const mapState = (state) => {
  return {
    offset: 0
  };
};

const bars = chart(connect(mapState)(Bars));
export default bars;

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

import {toArray} from '../utils';

const types = {
  number: {},
  string: {},
  any: {},
  enum: () => {
    const values = toArray(arguments);
    // TODO
  }
};
export default types;

import {toArray} from '../utils';

const types = {
  number: {},
  string: {},
  any: {},
  object: {},
  enum: () => {
    const valid = toArray(arguments);
    return {valid};
  }
};
export default types;

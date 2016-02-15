import {
  includes,
  toArray
} from '../utils';

const types = {
  boolean: {},
  number: {},
  string: {},
  any: {},
  array: {},
  object: {},
  enum: () => {
    const valid = toArray(arguments);
    return {
      validate: (value) => includes(valid, value)
    };
  }
};
export default types;

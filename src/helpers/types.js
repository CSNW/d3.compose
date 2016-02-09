import {
  includes,
  toArray
} from '../utils';

const types = {
  number: {},
  string: {},
  any: {},
  object: {},
  enum: () => {
    const valid = toArray(arguments);
    return {
      validate: (value) => includes(valid, value)
    };
  }
};
export default types;

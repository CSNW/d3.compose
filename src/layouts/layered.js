import {toArray} from '../utils';

export default function layered(items) {
  if (arguments.length > 1 || !Array.isArray(items)) {
    items = toArray(arguments);
  }

  return {
    _layered: true,
    items: items
  };
}

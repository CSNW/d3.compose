import {isObject} from '../utils';

export default function getTranslate(x, y) {
  if (isObject(x)) {
    y = x.y;
    x = x.x;
  }

  return 'translate(' + (x || 0) + ', ' + (y || 0) + ')';
}

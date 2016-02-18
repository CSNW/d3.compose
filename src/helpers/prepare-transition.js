import {isUndefined} from '../utils';

export default function prepareTransition(transition) {
  return function() {
    if (!transition) {
      return;
    }

    if (!isUndefined(transition.duration)) {
      this.duration(transition.duration);
    }
    if (!isUndefined(transition.delay)) {
      this.delay(transition.delay);
    }
    if (!isUndefined(transition.ease)) {
      this.ease(transition.ease);
    }
  };
}

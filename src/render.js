import {assign} from './utils';
import Compose from './compose';

export default function render(children, selection, options = {}) {
  const instance = new Compose(selection, assign({children}, options));
  instance.render();

  return instance;
}

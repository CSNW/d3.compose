import {assign} from './utils';
import {Chart} from './chart';

const Compose = Chart.extend({
  render() {
    var children = this.props.children || [];
    if (!Array.isArray(children)) {
      children = [children];
    }

    this.children = children.map(child => new child.type(this.base, child.props));
    this.children.forEach(instance => instance.render());
  },

  draw(children) {
    this.props = assign({}, this.props, {children});
    this.render();
  }
});
export default Compose;

import {Chart} from './chart';

const Compose = Chart.extend({
  render() {
    var children = this.props.children || [];
    if (!Array.isArray(children)) {
      children = [children];
    }

    this.children = children.map(child => new child.type(this.base, child.props));
    this.children.forEach(instance => instance.render());
  }
});
export default Compose;

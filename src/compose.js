import {
  assign,
  objectEach
} from './utils';
import {
  getDimensions,
  getLayer,
  getTranslate
} from './helpers';
import {Chart} from './chart';
import {prepareDescription, calculateLayout} from './layout';

const Compose = Chart.extend({
  render() {
    var description = this.props.description || [];
    if (!Array.isArray(description)) {
      description = [description];
    }

    const dimensions = getDimensions(this.base);

    // 1. Prepare children
    const prepared = prepareDescription(description);
    this.prepareChildren(prepared, dimensions);

    // 2. Extract and calculate layout
    const extracted = this.extractLayout(prepared);
    const layout = calculateLayout(extracted, dimensions);

    // 4. Apply calculated layout
    this.applyLayout(prepared, layout);

    // 5. Render children
    this.children.forEach(child => child.render());
  },

  draw(description) {
    this.props = assign({}, this.props, {description});
    this.render();
  },

  prepareChildren(prepared, dimensions) {
    this.children = prepared.ordered.map((_id) => {
      const {props, type} = prepared.byId[_id];

      // For layout, override with default layout
      const withLayout = assign({}, props, {
        top: 0,
        right: dimensions.width,
        bottom: dimensions.height,
        left: 0,
        width: dimensions.width,
        height: dimensions.height
      });

      const child = new type(getLayer(this.base, _id), withLayout);
      child._id = _id;

      return child;
    });
  },

  extractLayout(prepared) {
    return this.children.map((child) => {
      const _id = child._id;
      const layout = extractLayout(prepared.byId[_id].props);
      return assign({_id}, child.prepareLayout(layout));
    });
  },

  applyLayout(prepared, layout) {
    const byId = {};
    this.children.forEach((child) => {
      byId[child._id] = child;
    });

    objectEach(layout.byId, (values, _id) => {
      const child = byId[_id];
      const props = assign({}, prepared.byId[_id].props, values);
      child.setProps(props);

      // TODO Handle margins
      child.base.attr('transform', getTranslate(values.x, values.y));
    });
  }
});
export default Compose;

function extractLayout(props) {
  const {width, height, top, right, bottom, left, zIndex, margin} = props;
  return {width, height, top, right, bottom, left, zIndex, margin};
}

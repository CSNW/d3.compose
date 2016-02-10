import {
  assign,
  isObject,
  isUndefined,
  objectEach
} from './utils';

export function prepareDescription(description) {
  return toSurround(description);
}

const layoutProps = ['top', 'right', 'bottom', 'left', 'width', 'height'];
export function calculateLayout(layout, dimensions) {
  // 1. Create references for each layout item
  const byId = {};
  const ordered = [];
  layout.forEach((item) => {
    byId[item._id] = {
      margin: getDefaultMargin(item.margin),
      zIndex: 0
    };

    layoutProps.forEach((key) => {
      byId[item._id][key] = layoutReference(item[key]);
    });

    ordered.push(item._id);
  });

  const container = {
    top: layoutReference(0),
    right: layoutReference(dimensions.width),
    bottom: layoutReference(dimensions.height),
    left: layoutReference(0),
    width: layoutReference(dimensions.width),
    height: layoutReference(dimensions.height)
  };

  // 2. Replace constraints with references
  objectEach(byId, (item) => {
    layoutProps.forEach((key) => {
      const constraint = item[key];
      if (constraint._id) {
        const reference = constraint._id == '_container' ? container : byId[constraint._id];
        item[key] = reference[constraint.key];
      }
    });
  });

  // 3. Calculate values
  var iteration = 0;
  var solved = false;
  const maxIterations = 100;
  while (!solved && iteration < maxIterations) {
    solved = true;

    objectEach(byId, (item) => {
      var has = hasResults();

      // Top
      if (!has.top && has.bottom && has.height) {
        item.top.result = item.bottom.result - (item.margin.top + item.height.result + item.margin.bottom);
      }

      // Right
      if (!has.right && has.left && has.width) {
        item.right.result = item.left.result + (item.margin.left + item.width.result + item.margin.right);
      }

      // Bottom
      if (!has.bottom && has.top && has.height) {
        item.bottom.result = item.top.result + (item.margin.top + item.height.result + item.margin.bottom);
      }

      // Left
      if (!has.left && has.right && has.width) {
        item.left.result = item.right.result - (item.margin.left + item.width.result + item.margin.right);
      }

      // Width
      if (!has.width && has.right && has.left) {
        item.width.result = item.right.result - item.left.result - item.margin.left - item.margin.right;
      }

      // Height
      if (!has.height && has.bottom && has.top) {
        item.height.result = item.bottom.result - item.top.result - item.margin.top - item.margin.bottom;
      }

      has = hasResults();
      if (!has.top || !has.right || !has.bottom || !has.left || !has.width || !has.height) {
        solved = false;
      }

      function hasResults() {
        return {
          top: !isUndefined(item.top.result),
          right: !isUndefined(item.right.result),
          bottom: !isUndefined(item.bottom.result),
          left: !isUndefined(item.left.result),
          width: !isUndefined(item.width.result),
          height: !isUndefined(item.height.result)
        };
      }
    });

    iteration++;
  }

  if (iteration === maxIterations) {
    throw new Error('Failed to calculate layout based on the given constraints');
  }

  // 4. Extract results
  const results = {};
  objectEach(byId, (item, _id) => {
    results[_id] = {
      x: item.left.result,
      y: item.top.result,
      width: item.width.result,
      height: item.height.result,
      margin: item.margin,
      zIndex: item.zIndex
    };
  });

  return {
    byId: results,
    ordered
  };
}

// Placeholder until formal constraints
export const constraint = {
  eq(item, key) {
    if (item) {
      return {_id: item._id, type: 'equal', key};
    }
  },
  flex(grow = 1) {
    return {type: 'flex', grow};
  }
}

function layoutReference(value) {
  if (isObject(value)) {
    return value;
  } else if (!isUndefined(value)) {
    return {result: value};
  } else {
    return {};
  }
}

const defaultMargin = {top: 0, right: 0, bottom: 0, left: 0};
function getDefaultMargin(margin) {
  if (!isUndefined(margin) && !isObject(margin)) {
    margin = {top: margin, right: margin, bottom: margin, left: margin};
  }

  return assign({}, defaultMargin, margin);
}

// Placeholder until formal constraints/layouts are added
function toSurround(description) {
  var {
    top,
    right,
    bottom,
    left,
    middle
  } = extractSurroundPositions(description);

  const container = {_id: '_container'};
  const topEdge = top[top.length - 1] && constraint.eq(top[top.length - 1], 'bottom') || 0;
  const rightEdge = right[0] && constraint.eq(right[0], 'left') || constraint.eq(container, 'right');
  const bottomEdge = bottom[0] && constraint.eq(bottom[0], 'top') || constraint.eq(container, 'bottom');
  const leftEdge = left[left.length - 1] && constraint.eq(left[left.length - 1], 'right') || 0;

  top = top.map((item, i, items) => {
    const layout = {
      _position: 'top',
      top: items[i - 1] && constraint.eq(items[i - 1], 'bottom') || 0,
      left: leftEdge,
      right: rightEdge,
      width: constraint.flex()
    };

    item = assign({}, item);
    item.props = assign(layout, item.props);
    return item;
  });
  right = right.map((item, i, items) => {
    const layout = {
      _position: 'right',
      right: items[i - 1] && constraint.eq(items[i - 1], 'left') || constraint.eq(container, 'right'),
      top: topEdge,
      bottom: bottomEdge,
      height: constraint.flex()
    };

    item = assign({}, item);
    item.props = assign(layout, item.props);
    return item;
  });
  bottom = bottom.map((item, i, items) => {
    const layout = {
      _position: 'bottom',
      bottom: items[i + 1] && constraint.eq(items[i + 1], 'top') || constraint.eq(container, 'bottom'),
      left: leftEdge,
      right: rightEdge,
      width: constraint.flex()
    };

    item = assign({}, item);
    item.props = assign(layout, item.props);
    return item;
  });
  left = left.map((item, i, items) => {
    const layout = {
      _position: 'left',
      left: items[i - 1] && constraint.eq(items[i - 1], 'right') || 0,
      top: topEdge,
      bottom: bottomEdge,
      height: constraint.flex()
    };

    item = assign({}, item);
    item.props = assign(layout, item.props);
    return item;
  });
  middle = middle.map((item) => {
    const layout = {
      _position: 'middle',
      top: topEdge,
      right: rightEdge,
      bottom: bottomEdge,
      left: leftEdge,
      width: constraint.flex(),
      height: constraint.flex()
    };

    item = assign({}, item);
    item.props = assign(layout, item.props);
    return item;
  });

  const allItems = top.concat(left).concat(middle).concat(right).concat(bottom);
  const byId = {};
  const ordered = [];
  allItems.forEach((item) => {
    byId[item._id] = item;
    ordered.push(item._id);
  });

  return {byId, ordered};
}

function extractSurroundPositions(description) {
  const top = [];
  const bottom = [];
  const right = [];
  const left = [];
  const middle = [];
  var foundRow = false;
  var foundMiddle = false;

  description.forEach((row, rowIndex) => {
    if (!Array.isArray(row)) {
      row = [row];
    } else if (row.length > 1) {
      foundRow = true;
    }

    row.forEach((item, itemIndex) => {
      if (!item) {
        return;
      }

      if (item._layered) {
        foundMiddle = foundRow = true;

        item.items.forEach((chart, chartIndex) => {
          middle.push(assign({}, chart, {_id: getId(rowIndex, itemIndex, chartIndex)}));
        });

        return;
      }

      item = assign({}, item, {_id: getId(rowIndex, itemIndex)});

      if (row.length > 1 && !foundMiddle) {
        left.push(item);
      } else if (row.length > 1 && foundMiddle) {
        right.push(item);
      } else if (!foundRow) {
        top.push(item);
      } else {
        bottom.push(item);
      }
    });
  });

  return {
    top,
    right,
    bottom,
    left,
    middle
  };
}

function getId(rowIndex, colIndex, layeredIndex) {
  var id = `item-${rowIndex + 1}-${colIndex + 1}`;
  if (!isUndefined(layeredIndex)) {
    id += `-${layeredIndex + 1}`;
  }
  return id;
}

import {
  contains,
  defaults,
  extend,
  isFunction,
  objectEach
} from './utils';

/*
  Extract layout from the given options
*/
export function extractLayout(options) {
  var layout = {
    data: {
      charts: {},
      components: {}
    }
  };

  if (!options) {
    return layout;
  }
  else {
    layout.charts = [];
    layout.components = [];
  }

  if (Array.isArray(options)) {
    // TEMP Idenfify charts from layered,
    // eventually no distinction between charts and components
    var found = {
      row: false,
      charts: false
    };

    options.forEach(function(row, row_index) {
      if (!row)
        return;

      // Components are added from inside-out
      // so for position: top, position: left, use unshift

      if (Array.isArray(row)) {
        found.row = true;
        var row_components = [];

        row.forEach(function(item, col_index) {
          if (!item)
            return;

          if (item._layered) {
            found.charts = true;
            layout.charts = item.items.map(function(chart, chart_index) {
              return defaults({}, chart, {id: 'chart-' + (chart_index + 1)});
            });
          }
          else if (!found.charts) {
            row_components.unshift(prepareComponent(item, 'left', row_index, col_index));
          }
          else {
            row_components.push(prepareComponent(item, 'right', row_index, col_index));
          }
        });

        layout.components = layout.components.concat(row_components);
      }
      else {
        if (row._layered) {
          found.row = found.charts = true;
          layout.charts = row.items.slice();
        }
        else {
          if (!found.row)
            layout.components.unshift(prepareComponent(row, 'top', row_index, 0));
          else
            layout.components.push(prepareComponent(row, 'bottom', row_index, 0));
        }
      }
    });
  }
  else {
    // DEPRECATED
    extractLayoutFromObject(layout, options);
  }

  layout.charts.forEach(extractData('charts'));
  layout.components.forEach(extractData('components'));

  return layout;

  function prepareComponent(component, position, row_index, col_index) {
    if (component && isFunction(component.position))
      component.position(position);
    else
      component = extend({position: position}, component);

    return defaults(component, {id: 'component-' + (row_index + 1) + '-' + (col_index + 1)});
  }

  function extractData(type) {
    return function(item) {
      if (item.data && !isFunction(item.data)) {
        layout.data[type][item.id] = item.data;
        delete item.data;
      }
    };
  }
}

// DEPRECATED
function extractLayoutFromObject(layout, options) {
  if (typeof console != 'undefined' && console.warn)
    console.warn('DEPRECATED - object-style options have been deprecated for array-style options and will be removed in the next version of d3.compose');

  objectEach(options.charts, function(chart_options, id) {
    layout.charts.push(extend({id: id}, chart_options));
  });

  objectEach(options.components, function(component_options, id) {
    layout.components.push(extend({id: id}, component_options));
  });
}

/*
  Calculate component and chart coordinates for given layout
*/
export function calculateLayout(components, data, demux) {
  var overall_layout = {top: [], right: [], bottom: [], left: []};
  components.forEach(function(component) {
    if (component.skip_layout || !component.getLayout)
      return;

    var layout = component.getLayout(demux(component.id, data));
    var position = layout && layout.position;

    if (!contains(['top', 'right', 'bottom', 'left'], position))
      return;

    overall_layout[position].push({
      offset: position == 'top' || position == 'bottom' ? layout.height : layout.width,
      component: component
    });
  });

  return overall_layout;
}

/*
  Apply calculated layout to charts and components
*/
export function applyLayout(layout, chart_position, width, height) {
  layout.top.reduce(function(previous, part) {
    var y = previous - part.offset;
    setLayout(part.component, chart_position.left, y, {width: chart_position.width});

    return y;
  }, chart_position.top);

  layout.right.reduce(function(previous, part, index, parts) {
    var previousPart = parts[index - 1] || {offset: 0};
    var x = previous + previousPart.offset;
    setLayout(part.component, x, chart_position.top, {height: chart_position.height});

    return x;
  }, width - chart_position.right);

  layout.bottom.reduce(function(previous, part, index, parts) {
    var previousPart = parts[index - 1] || {offset: 0};
    var y = previous + previousPart.offset;
    setLayout(part.component, chart_position.left, y, {width: chart_position.width});

    return y;
  }, height - chart_position.bottom);

  layout.left.reduce(function(previous, part) {
    var x = previous - part.offset;
    setLayout(part.component, x, chart_position.top, {height: chart_position.height});

    return x;
  }, chart_position.left);

  function setLayout(component, x, y, options) {
    if (component && isFunction(component.setLayout))
      component.setLayout(x, y, options);
  }
}

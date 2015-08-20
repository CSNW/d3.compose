import {
  contains,
  defaults,
  isFunction
} from './utils';

/*
  Extract layout from the given options

  @param {Array} options
  @return {Object} {data, items, layout}
*/
export function extractLayout(options) {
  if (!options)
    return;

  var data = {
    _charts: {},
    _components: {}
  };
  var items = {};
  var layout = [];
  var charts = [];
  var components = [];

  // TEMP Idenfify charts from layered,
  // eventually no distinction between charts and components
  var found = {
    row: false,
    charts: false
  };

  // Components are added from inside-out
  // so for position: top, position: left, use unshift
  options.forEach(function(row, row_index) {
    var row_components = [];

    if (!Array.isArray(row))
      row = [row];
    if (row.length > 1)
      found.row = true;

    var row_layout = row.map(function(item, col_index) {
      if (!item)
        return;

      if (item._layered) {
        // Charts
        found.charts = found.row = true;
        var chart_ids = [];

        item.items.forEach(function(chart, chart_index) {
          if (!chart)
            return;

          chart = defaults({}, chart, {id: getId(row_index, col_index, chart_index)});

          chart_ids.push(chart.id);
          charts.push(chart);
          items[chart.id] = chart;
        });

        return chart_ids;
      }

      var component = prepareComponent(item, row_index, col_index);
      items[component.id] = component;

      if (row.length > 1) {
        if (!found.charts) {
          // Left
          setPosition(component, 'left');
          row_components.unshift(component);
        }
        else {
          // Right
          setPosition(component, 'right');
          row_components.push(component);
        }
      }
      else {
        if (!found.row) {
          // Top
          setPosition(component, 'top');
          components.unshift(component);
        }
        else {
          // Bottom
          setPosition(component, 'bottom');
          components.push(component);
        }
      }

      return component.id;
    });

    if (row_components.length)
      components = components.concat(row_components);

    layout.push(row_layout);
  });

  charts.forEach(extractData('_charts'));
  components.forEach(extractData('_components'));

  return {
    data: data,
    items: items,
    layout: layout,

    charts: charts,
    components: components
  };

  function prepareComponent(component, row_index, col_index) {
    return defaults({}, component, {id: getId(row_index, col_index)});
  }
  function setPosition(component, position) {
    if (component && isFunction(component.position))
      component.position(position);
    else
      component.position = position;
  }
  function getId(row_index, col_index, layered_index) {
    var id = 'item-' + (row_index + 1) + '-' + (col_index + 1);
    if (layered_index != null)
      id += '-' + (layered_index + 1);

    return id;
  }

  function extractData(type) {
    return function(item) {
      if (item.data && !isFunction(item.data)) {
        data[type][item.id] = item.data;
        data[item.id] = item.data;
        delete item.data;
      }
    };
  }
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

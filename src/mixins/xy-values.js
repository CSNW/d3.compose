import {assign} from '../utils';
import {
  types,
  scaleBandSeries
} from '../helpers';
import {isSeriesData} from './series';
import {
  properties as xyProperties,
  getValue,
  defaultXValue
} from './xy';

export var unsupportedScale = 'Only d3.scale.ordinal() and scaleBandSeries() are supported for xScale';

export function getDefaultXScale(props) {
  return scaleBandSeries()
    .domain(getOrdinalDomain(props.data, props.xValue || defaultXValue))
    .seriesCount(isSeriesData(props.data) ? props.data.length : 1);
}

export var properties = assign({},
  xyProperties,
  {
    xScale: {
      type: types.fn,
      getDefault: getDefaultXScale
    },
    xScalePadding: {
      type: types.number,
      getDefault: function() { return 0.1; }
    },
    xScaleOuterPadding: {
      type: types.number,
      getDefault: function() { return 0.1; }
    }
  }
);

export function prepare(selection, props) {
  var xScale = props.xScale;
  var yScale = props.yScale;

  xScale = xScale.copy()
  if (xScale.rangeRoundBands) {
    xScale.rangeRoundBands([0, props.width], props.xScalePadding, props.xScaleOuterPadding);
  } else {
    throw new Error(unsupportedScale);
  }

  yScale = yScale.copy()
    .range([props.height, 0]);

  return assign({}, props, {xScale: xScale, yScale: yScale});
}

export {
  getValue
};

export function getWidth(xScale) {
  if (xScale.rangeBand) {
    return xScale.rangeBand();
  } else {
    throw new Error(unsupportedScale);
  }
}

export function getOrdinalDomain(data, getValue) {
  if (!isSeriesData(data)) {
    return data.map(getValue);
  }

  var values = data.reduce(function(memo, series) {
    var uniq = series.values
      .map(getValue)
      .filter(function(value) { return memo.indexOf(value < 0); });

    return memo.concat(uniq);
  }, []);

  return values.sort();
}

var xyValues = {
  getDefaultXScale: getDefaultXScale,
  properties: properties,
  prepare: prepare,
  getValue: getValue,
  getWidth: getWidth,
  getOrdinalDomain: getOrdinalDomain
}
export default xyValues;

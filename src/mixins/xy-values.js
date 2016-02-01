import {assign} from '../utils';
import {getDimensions, types, scaleBandSeries} from '../helpers';
import {isSeriesData} from './series';
import {properties as xyProperties, getValue, defaultXValue} from './xy';

export const unsupportedScale = 'Only d3.scale.ordinal() and scaleBandSeries() are supported for xScale';

export const getDefaultXScale = ({data, xValue}) => {
  return scaleBandSeries()
    .domain(getOrdinalDomain(data, xValue || defaultXValue))
    .seriesCount(isSeriesData(data) ? data.length : 1);
}

export const properties = assign({},
  xyProperties,
  {
    xScale: {
      type: types.fn,
      getDefault: getDefaultXScale
    },
    xScalePadding: {
      type: types.number,
      getDefault: () => 0.1
    },
    xScaleOuterPadding: {
      type: types.number,
      getDefault: () => 0.1
    }
  }
);

export const prepare = (selection, props) => {
  // TODO Get dimensions from props
  const {xScalePadding, xScaleOuterPadding} = props;
  var {xScale, yScale} = props;

  const dimensions = getDimensions(selection);

  xScale = xScale.copy()
  if (xScale.rangeRoundBands) {
    xScale.rangeRoundBands([0, dimensions.width], xScalePadding, xScaleOuterPadding);
  } else {
    throw new Error(unsupportedScale);
  }

  yScale = yScale.copy()
    .range([dimensions.height, 0]);

  return assign({}, props, {xScale, yScale});
};

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

  const values = data.reduce((memo, series, j) => {
    const uniq = series.values
      .map(getValue)
      .filter(value => memo.indexOf(value < 0));

    return memo.concat(uniq);
  }, []);

  return values.sort();
}

const xyValues = {
  getDefaultXScale,
  properties,
  prepare,
  getValue,
  getWidth,
  getOrdinalDomain
}
export default xyValues;

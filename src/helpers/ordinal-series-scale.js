import d3 from 'd3';
import {
  objectEach,
  isUndefined
} from '../utils';

export default function ordinalSeriesScale(props) {
  const underlying = d3.scale.ordinal();
  var _seriesCount = 1;
  var _seriesPadding = 0;
  var _range, _innerPadding, _outerPadding;

  function scale(value, seriesIndex) {
    const scaled = underlying(value);
    const width = scale.rangeBand();
    const padding = getPadding();

    return scaled + (padding / 2) + (seriesIndex * (width + padding)) + (width / 2);
  };

  // TODO scale.adjacent: true/false
  // TODO centered value

  scale.seriesCount = function(count) {
    if (!arguments.length)
      return _seriesCount;

    _seriesCount = count;
    return scale;
  };

  scale.seriesPadding = function(value) {
    if (!arguments.length)
      return _seriesPadding;

    _seriesPadding = value;
    return scale;
  };

  scale.domain = function(values) {
    if (!arguments.length)
      return underlying.domain();

    underlying.domain(values);
    return scale;
  };

  scale.rangeRoundBands = function(range, innerPadding, outerPadding) {
    _range = range;
    _innerPadding = innerPadding;
    _outerPadding = outerPadding;
    underlying.rangeRoundBands(range, innerPadding, outerPadding);
    return scale;
  };

  scale.rangeBand = function() {
    return (underlying.rangeBand() / _seriesCount) - getPadding();
  };

  scale.copy = function() {
    return ordinalSeriesScale({
      seriesCount: _seriesCount,
      seriesPadding: _seriesPadding,
      domain: underlying.domain(),
      rangeRoundBands: [_range, _innerPadding, _outerPadding]
    });
  };

  scale._ordinalSeries = true;

  function getPadding() {
    var width = underlying.rangeBand() / _seriesCount;
    return _seriesPadding * width;
  }

  objectEach(props, (value, key) => {
    if (key == 'rangeRoundBands') {
      if (!isUndefined(value[2])) {
        scale.rangeRoundBands(value[0], value[1], value[2]);
      } else if (!isUndefined(value[1])) {
        scale.rangeRoundBands(value[0], value[1]);
      } else if (!isUndefined(value[0])) {
        scale.rangeRoundBands(value[0]);
      }
    } else if (scale[key]) {
      scale[key](value);
    }
  });

  return scale;
}

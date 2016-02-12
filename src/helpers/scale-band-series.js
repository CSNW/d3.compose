import d3 from 'd3';
import {isUndefined} from '../utils';

// Note: Will need to be updated for compatibility with v3 and v4
// (v3 = ordinal + rangeRoundBands, v4 = band + rangeRound)

export default function scaleBandSeries() {
  const underlying = d3.scale.ordinal();
  var _adjacent = true;
  var _seriesCount = 1;
  var _seriesPadding = 0;
  var _range, _innerPadding, _outerPadding;

  function scale(value, seriesIndex) {
    seriesIndex = _seriesCount > 1 && _adjacent && seriesIndex ? seriesIndex : 0;
    const scaled = underlying(value);
    const width = scale.rangeBand();
    const padding = getPadding();

    return scaled + (padding / 2) + (seriesIndex * (width + padding)) + (width / 2);
  }

  // TODO centered value

  scale.adjacent = function(value) {
    if (!arguments.length) return _adjacent;

    _adjacent = value;
    return scale;
  };

  scale.seriesCount = function(count) {
    if (!arguments.length) return _seriesCount;

    _seriesCount = count;
    return scale;
  };

  scale.seriesPadding = function(value) {
    if (!arguments.length) return _seriesPadding;

    _seriesPadding = value;
    return scale;
  };

  scale.domain = function(values) {
    if (!arguments.length) return underlying.domain();

    underlying.domain(values);
    return scale;
  };

  scale.rangeRoundBands = function(range, innerPadding, outerPadding) {
    _range = range;
    _innerPadding = innerPadding;
    _outerPadding = outerPadding;

    if (!isUndefined(outerPadding)) {
      underlying.rangeRoundBands(range, innerPadding, outerPadding);
    } else if (!isUndefined(innerPadding)) {
      underlying.rangeRoundBands(range, innerPadding);
    } else {
      underlying.rangeRoundBands(range);
    }

    return scale;
  };

  scale.rangeBand = function() {
    if (!_adjacent || _seriesCount <= 1) {
      return underlying.rangeBand();
    }

    return (underlying.rangeBand() / _seriesCount) - getPadding();
  };

  scale.copy = function() {
    const copied = scaleBandSeries()
      .adjacent(_adjacent)
      .seriesCount(_seriesCount)
      .seriesPadding(_seriesPadding)
      .domain(underlying.domain());

    if (!isUndefined(_outerPadding)) {
      copied.rangeRoundBands(_range, _innerPadding, _outerPadding);
    } else if (!isUndefined(_innerPadding)) {
      copied.rangeRoundBands(_range, _innerPadding);
    } else if (!isUndefined(_range)) {
      copied.rangeRoundBands(_range);
    }

    return copied;
  };

  scale._ordinalSeries = true;

  function getPadding() {
    if (!_adjacent || _seriesCount <= 1) {
      return 0;
    }

    const width = underlying.rangeBand() / _seriesCount;
    return _seriesPadding * width;
  }

  return scale;
}

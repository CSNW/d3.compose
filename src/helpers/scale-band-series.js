import d3 from 'd3';

// Note: Will need to be updated for compatibility with v3 and v4
// (v3 = ordinal + rangeRoundBands, v4 = band + rangeRound)

export default function scaleBandSeries() {
  var underlying = d3.scale.ordinal();
  var domain = underlying.domain;
  var range = [0, 1];
  var round = false;
  var paddingInner = 0;
  var paddingOuter = 0;
  var paddingSeries = 0;
  var adjacent = true;
  var centered = true;
  var series = 1;
  var bandwidth, step;

  function scale(d, j) {
    j = series > 1 && adjacent && j ? j : 0;
    var edge = underlying(d);
    var aligned = edge + step * j

    return centered ? aligned + bandwidth / 2 : aligned;
  }

  function rescale() {
    var setRange = round ? 'rangeRoundBands' : 'rangeBands';
    underlying[setRange](range, paddingInner, paddingOuter);
    var width = underlying.rangeBand();

    if (series > 1 && adjacent) {
      // TODO round + align
      step = width / (series - paddingSeries)
      bandwidth = step - (paddingSeries * step);
    } else {
      step = 0;
      bandwidth = width;
    }

    return scale;
  }

  scale.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.range = function(_) {
    return arguments.length ? (range = [+_[0], +_[1]], rescale()) : range.slice();
  };

  scale.rangeRound = function(_) {
    return range = [+_[0], +_[1]], round = true, rescale();
  };

  scale.bandwidth = scale.rangeBand = function() {
    return bandwidth;
  };

  scale.round = function(_) {
    return arguments.length ? (round = !!_, rescale()) : round;
  };

  scale.padding = function(_) {
    return arguments.length ? (paddingInner = paddingOuter = paddingSeries = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingInner = function(_) {
    return arguments.length ? (paddingInner =  Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingOuter = function(_) {
    return arguments.length ? (paddingOuter =  Math.max(0, Math.min(1, _)), rescale()) : paddingOuter;
  };

  scale.paddingSeries = function(_) {
    return arguments.length ? (paddingSeries = Math.max(0, Math.min(1, _)), rescale()) : paddingSeries;
  }

  scale.adjacent = function(_) {
    return arguments.length ? (adjacent = !!_, rescale()) : adjacent;
  };

  scale.centered = function(_) {
    return arguments.length ? (centered = !!_, scale) : centered;
  };

  scale.series = function(_) {
    return arguments.length ? (series = Math.max(1, _), rescale()) : series;
  };

  // TODO align

  scale.copy = function() {
    return scaleBandSeries()
      .domain(domain())
      .range(range)
      .round(round)
      .paddingInner(paddingInner)
      .paddingOuter(paddingOuter)
      .paddingSeries(paddingSeries)
      .adjacent(adjacent)
      .centered(centered)
      .series(series);
  }

  return rescale();
}

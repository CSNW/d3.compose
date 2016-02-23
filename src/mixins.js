import series from './mixins/series';
import xy from './mixins/xy';
import xyValues from './mixins/xy-values';

var mixins = {
  series: series,
  xy: xy,
  xyValues: xyValues
};

export {
  mixins as default,
  series,
  xy,
  xyValues
};

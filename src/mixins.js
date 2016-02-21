import series from './mixins/series';
import xy from './mixins/xy';
import xyInverted from './mixins/xy-inverted';
import xyValues from './mixins/xy-values';
import xyValuesInverted from './mixins/xy-values-inverted';

var mixins = {
  series: series,
  xy: xy,
  xyValues: xyValues,
  xyInverted: xyInverted,
  xyValuesInverted: xyValuesInverted
};

export {
  mixins as default,
  series,
  xy,
  xyInverted,
  xyValues,
  xyValuesInverted
};

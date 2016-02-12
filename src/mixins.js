import series from './mixins/series';
import xy from './mixins/xy';
import xyInverted from './mixins/xy-inverted';
import xyValues from './mixins/xy-values';
import xyValuesInverted from './mixins/xy-values-inverted';

const mixins = {
  series,
  xy,
  xyValues,
  xyInverted,
  xyValuesInverted
};

export {
  mixins as default,
  series,
  xy,
  xyInverted,
  xyValues,
  xyValuesInverted
};

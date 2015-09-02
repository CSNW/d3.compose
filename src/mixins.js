import Series from './mixins/series';
import XY from './mixins/xy';
import XYValues from './mixins/xy-values';
import XYInverted from './mixins/xy-inverted';
import Labels, { LabelsXY } from './mixins/labels';
import Hover, { HoverPoints } from './mixins/hover';
import Transition from './mixins/transition';
import StandardLayer from './mixins/standard-layer';

var mixins = {
  Series: Series,
  XY: XY,
  XYValues: XYValues,
  XYInverted: XYInverted,
  Labels: Labels,
  LabelsXY: LabelsXY,
  Hover: Hover,
  HoverPoints: HoverPoints,
  Transition: Transition,
  StandardLayer: StandardLayer
};

export {
  mixins as default,
  Series,
  XY,
  XYValues,
  XYInverted,
  Labels,
  LabelsXY,
  Hover,
  HoverPoints,
  Transition,
  StandardLayer
};

import Series from './series';
import XY from './xy';
import XYValues from './xy-values';
import XYInverted from './xy-inverted';
import Labels, { LabelsXY } from './labels';
import Hover, { HoverPoints } from './hover';
import Transition from './transition';
import StandardLayer from './standard-layer';

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

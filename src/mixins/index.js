import Series from './series';
import XY from './xy';
import XYValues from './xy-values';
import InvertedXY from './inverted-xy';
import Labels, { XYLabels } from './labels';
import Hover, { HoverPoints } from './hover';
import Transition from './transition';
import StandardLayer from './standard-layer';

var mixins = {
  Series: Series,
  XY: XY,
  XYValues: XYValues,
  InvertedXY: InvertedXY,
  Labels: Labels,
  XYLabels: XYLabels,
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
  InvertedXY,
  Labels,
  XYLabels,
  Hover,
  HoverPoints,
  Transition,
  StandardLayer
};

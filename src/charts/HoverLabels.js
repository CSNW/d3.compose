import d3 from 'd3';
import {
  property,
  mixin,
  createHelper
} from '../helpers';
import {
  Hover
} from '../mixins';
import Labels from './Labels';
/**
  (in-progress)

  @class HoverLabels
*/
var Mixed = mixin(Labels, Hover);
var HoverLabels = Mixed.extend({
  initialize: function(options) {
    Mixed.prototype.initialize.call(this, options);
    this.on('attach', function() {
      this.container.on('mouseenter:point', this.onMouseEnterPoint.bind(this));
      this.container.on('mouseleave:point', this.onMouseLeavePoint.bind(this));
    }.bind(this));
  },

  /**
    Maximum distance to find active points

    @property hoverTolerance
    @type Number
    @default Infinity
  */
  hoverTolerance: property({
    set: function(value) {
      // Pass through hover tolerance to parent (if present)
      if (this.parent && this.parent.hoverTolerance)
        this.parent.hoverTolerance(value);
    },
    default_value: Infinity
  }),

  // Don't fade in labels, hidden until hover
  transitionLabels: function() {},

  onMouseEnterPoint: function(point) {
    var label = this.findLabelForPoint(point);
    if (label)
      d3.select(label).attr('opacity', 1);
  },
  onMouseLeavePoint: function(point) {
    var label = this.findLabelForPoint(point);
    if (label)
      d3.select(label).attr('opacity', 0);
  },

  findLabelForPoint: function(point) {
    var labels = this.base.selectAll('g.chart-series').selectAll('g');
    var chart = this;
    var label;

    labels.each(function(d, i, j) {
      var series = chart.seriesData.call(this, d, i, j);
      if (d === point.d && series === point.series)
        label = this;
    });

    return label;
  }
});

var hoverLabels = createHelper('HoverLabels');

d3.chart().HoverLabels = HoverLabels;
export {
  HoverLabels as default,
  hoverLabels
};

(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  // Axis: Add axis for given (x,y) series data
  d3.chart('Component')
    .mixin(extensions.Series, extensions.XY)
    .extend('Axis', {
      initialize: function() {
        this.axis = d3.svg.axis();

        this.layer('Axis', this.base.append('g').classed('axis', true), {
          dataBind: function(data) {
            // Force addition of just one axis with dummy data array
            // (Axis will be drawn using underlying chart scales and data)
            return this.selectAll('g')
              .data([0]);
          },
          insert: function() {
            var chart = this.chart();
            var position = chart.axisPosition();
            var orientation = chart.axisOrientation();

            // Get scale by orientation
            var scale = orientation == 'horizontal' ? chart._xScale() : chart._yScale();

            // Setup axis
            chart.axis
              .scale(scale)
              .orient(chart.axisOrient());

            return this.append('g');
          },
          events: {
            merge: function() {
              var chart = this.chart();
              this
                .attr('transform', chart.axisTranlation.call(chart))
                .call(chart.axis);
            }
          }
        });
      },

      axisTranlation: function(d, i) {
        var translationByPosition = {
          top: {x: 0, y: 0},
          right: {x: this.width(), y: 0},
          bottom: {x: 0, y: this.height()},
          left: {x: 0, y: 0},
          x0: {x: this.x0(d, i), y: 0},
          y0: {x: 0, y: this.y0(d, i)}
        };
        
        return helpers.translate(translationByPosition[this.axisPosition()]);
      },

      // Position axis: top, right, bottom, left, x0, y0
      axisPosition: property('axisPosition', {
        defaultValue: 'bottom',
        set: function(value) {
          // Update chartOffset by position
          var offset = this.chartOffset();
          var offsetDistance = this.axisOffset();
          var orient = this.axisOrient();
          
          if (!offset[orient]) {
            offset[orient] = offsetDistance;
            this.chartOffset(offset);
          }
        }
      }),
      // Distance to offset chart margin on axis side
      axisOffset: property('axisOffset', {
        defaultValue: function() {
          var orientation = this.axisOrientation();
          return orientation == 'horizontal' ? 30 : 60;
        }
      }),

      axisOrient: property('axisOrient', {
        defaultValue: function() {
          var orient = this.axisPosition();
          
          if (orient == 'x0')
            orient = 'left';
          else if (orient == 'y0')
            orient = 'bottom';
          
          return orient;
        }
      }),
      axisOrientation: function() {
        var byPosition = {
          top: 'horizontal',
          right: 'vertical',
          bottom: 'horizontal',
          left: 'vertical',
          x0: 'vertical',
          y0: 'horizontal'
        };

        return byPosition[this.axisPosition()];
      }
    });
  
  // AxisValues: Axis component for (key,value) series data
  d3.chart('Component')
    .mixin(d3.chart('Axis').prototype, extensions.Values)
    .extend('AxisValues');

})(d3, _, d3.chart.helpers, d3.chart.extensions);

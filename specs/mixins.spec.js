(function(d3, helpers, mixins) {
  var utils = helpers.utils;

  describe('mixins', function() {
    var Chart, chart, data, values, width, height, processed, transformed;

    // Process data to mimic actual data that is passed to (d, i) methods
    function processData(data) {
      return utils.map(data, function(series, index) {
        // Add series index to values for mocking
        utils.each(chart.seriesValues(series, index), function(value) {
          value.series = series;
        });

        return series;
      });
    }

    beforeEach(function() {
      data = [
        {key: 'A', values: [{x:0,y:0},{x:1,y:1},{x:2,y:2},{x:3,y:3},{x:4,y:4}]},
        {key: 'B', values: [{x:5,y:5},{x:6,y:6},{x:7,y:7},{x:8,y:8}]},
        {key: 'C', values: [{x:9,y:9},{x:10,y:10},{x:11,y:11},{x:12,y:12}]}
      ];
      values = [
        {key: 'A', values: [{x:'A',y:0},{x:'B',y:1},{x:'C',y:2},{x:'D',y:3},{x:'E',y:4}]},
        {key: 'B', values: [{x:'A',y:5},{x:'B',y:6},{x:'C',y:7},{x:'D',y:8},{x:'E',y:9}]}
      ];
      width = 600;
      height = 400;

      Chart = d3.chart('Chart').extend('Series', helpers.mixin(mixins.Series, {
        initialize: function() {
          this._layers = {
            mock: {
              draw: function(data) {
                transformed = data;
              }
            }
          };
        },
        data: function() {
          return data || [];
        },
        height: function() {
          return height;
        },
        width: function() {
          return width;
        }
      }));
    });

    describe('Series', function() {
      // Because seriesIndex get parent data of element, mock element
      function element(seriesIndex, dataIndex) {
        return {
          data: function() {
            return [processed[seriesIndex][dataIndex]];
          },
          parentNode: {
            data: function() {
              return [processed[seriesIndex]];
            }
          }
        };
      }

      beforeEach(function() {
        chart = new Chart();
        processed = processData(data);

        spyOn(d3, 'select').and.callFake(function(element) { return element; });
      });

      it('should get series for element', function() {
        expect(chart.seriesData.call(element(1, 2), processed[1].values[2])).toEqual(data[1]);
        expect(chart.seriesData.call(element(2, 1), processed[2].values[1])).toEqual(data[2]);
      });

      it('should get series index for given series after passing through seriesValues', function() {
        expect(chart.seriesIndex.call(element(1, 2), processed[1].values[2])).toEqual(1);
        expect(chart.seriesIndex.call(element(2, 1), processed[2].values[1])).toEqual(2);
      });

      it('should get item style and series style', function() {
        var context = element(1, 2);
        var series = processed[1];
        var d = processed[1].values[2];

        series.style = {fill: 'yellow', 'stroke-width': '1.5px'};
        expect(chart.itemStyle.call(context, series, 1)).toEqual('fill: yellow; stroke-width: 1.5px;');

        d.style = {fill: 'purple', 'font-size': '16px'};
        expect(chart.itemStyle.call(context, d, 2)).toEqual('fill: purple; font-size: 16px;');
      });

      it('should ensure data is in series form', function() {
        chart.draw([1, 2, 3]);
        expect(transformed).toEqual([{values: [1, 2, 3]}]);
      });
    });

    describe('XY', function() {
      beforeEach(function() {
        Chart = Chart.extend('XY', mixins.XY);
        chart = new Chart();
      });

      it('should set x,y-scale range by width/height', function() {
        expect(chart.xScale().range()).toEqual([0, 600]);
        expect(chart.yScale().range()).toEqual([400, 0]);
      });

      it('should only set x,y-scale domains if scales are not defined', function() {
        expect(chart.xScale().domain()).toEqual([0, 12]);
        expect(chart.yScale().domain()).toEqual([0, 12]);

        chart.xScale(d3.scale.linear().domain([0, 100]));
        chart.yScale(d3.scale.linear().domain([0, 100]));
        chart.setScales();

        expect(chart.xScale().domain()).toEqual([0, 100]);
        expect(chart.yScale().domain()).toEqual([0, 100]);
      });

      it('should return scaled x-value', function() {
        expect(chart.x(data[0].values[0])).toEqual(0);
        expect(chart.x(data[2].values[3])).toEqual(600);
      });

      it('should return scaled y-value', function() {
        expect(chart.y(data[0].values[0])).toEqual(400);
        expect(chart.y(data[2].values[3])).toEqual(0);
      });

      it('should handle varying data formats', function() {
        utils.each([
          [0, 10, 20],
          [{y: 0}, {y: 10}, {y: 20}],
          [[0, 0], [1, 10], [2, 20]],
          [{x: 0, y: 0}, {x: 1, y: 10}, {x: 2, y: 20}]
        ], function(test_case, i) {
          test_case = mixins.XY.transform(test_case);

          expect(chart.xValue(test_case[1])).toEqual(1);
          expect(chart.yValue(test_case[1])).toEqual(10);
        });
      });
    });

    describe('XYValues', function() {
      beforeEach(function() {
        Chart = Chart.extend('Values', mixins.XYValues);
        data = values;
        width = 100;

        chart = new Chart();
        chart.setScales();

        processed = processData(data);

        spyOn(chart, 'seriesIndex').and.callFake(function(d, i) {
          return d.series.seriesIndex;
        });
      });

      it('should set x-scale to ordinal with x-values', function() {
        expect(chart.xScale().domain()).toEqual(['A', 'B', 'C', 'D', 'E']);
      });

      it('should calculate adjacent width', function() {
        expect(chart.adjacentWidth()).toEqual(9);
      });

      it('should calculate layered width', function() {
        expect(chart.layeredWidth()).toEqual(18);
      });

      it('should calculate item width (from scale)', function() {
        expect(chart.itemWidth()).toEqual(18);

        chart.xScale({type: 'ordinal', domain: ['A', 'B', 'C', 'D', 'E'], series: 2, adjacent: true});
        expect(chart.itemWidth()).toEqual(9);
      });
    });
  });

})(d3, d3.compose.helpers, d3.compose.mixins);

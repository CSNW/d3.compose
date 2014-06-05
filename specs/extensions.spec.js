(function(d3, _, helpers, extensions) {
  
  describe('extensions', function() {
    var Chart, chart, data, values, width, height, processed;

    // Process data to mimic actual data that is passed to (d, i) methods
    function processData(data) {
      return _.map(data, function(series, index) {
        // Add series index to values for mocking
        _.each(chart.seriesValues(series, index), function(value) {
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

      Chart = d3.chart('Test', {
        initialize: function() {
          helpers.bindAllDi(this);
        },
        data: function() {
          return data || [];
        },
        options: function() {
          return {};
        },
        height: function() {
          return height;
        },
        width: function() {
          return width;
        }
      }).extend('Series', extensions.Series);
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
        expect(chart.dataSeries.call(element(1, 2), processed[1].values[2])).toEqual(data[1]);
        expect(chart.dataSeries.call(element(2, 1), processed[2].values[1])).toEqual(data[2]);
      });

      it('should get series index for given series after passing through seriesValues', function() {
        expect(chart.seriesIndex.call(element(1, 2), processed[1].values[2])).toEqual(1);
        expect(chart.seriesIndex.call(element(2, 1), processed[2].values[1])).toEqual(2);
      });

      it('should get style from data -> series -> options', function() {
        var context = element(1, 2);
        var d = processed[1].values[2];
        var i = 2;

        chart.options = function() { return {style: {fill: 'red', stroke: 'blue'}};};
        expect(chart.itemStyle.call(context, d, i)).toEqual('fill: red; stroke: blue;');

        data[1].style = {fill: 'yellow', 'stroke-width': '1.5px'};
        expect(chart.itemStyle.call(context, d, i)).toEqual('fill: yellow; stroke-width: 1.5px; stroke: blue;');

        data[1].values[2].style = {fill: 'purple', 'font-size': '16px'};
        expect(chart.itemStyle.call(context, d, i)).toEqual('fill: purple; font-size: 16px; stroke-width: 1.5px; stroke: blue;');
      });
    });

    describe('XY', function() {
      beforeEach(function() {
        Chart = Chart.extend('XY', helpers.mixin(extensions.Series, extensions.XY));
        chart = new Chart();
        chart.setScales();
      });

      it('should set x,y-scale range by width/height', function() {
        expect(chart._xScale().range()).toEqual([0, 600]);
        expect(chart._yScale().range()).toEqual([400, 0]);
      });

      it('should only set x,y-scale domains if scales are not defined', function() {
        expect(chart._xScale().domain()).toEqual([0, 12]);
        expect(chart._yScale().domain()).toEqual([0, 12]);

        chart.xScale(d3.scale.linear().domain([0, 100]));
        chart.yScale(d3.scale.linear().domain([0, 100]));
        chart.setScales();

        expect(chart._xScale().domain()).toEqual([0, 100]);
        expect(chart._yScale().domain()).toEqual([0, 100]);        
      });

      it('should return scaled x-value', function() {
        expect(chart.x(data[0].values[0])).toEqual(0);
        expect(chart.x(data[2].values[3])).toEqual(600);
      });

      it('should return scaled y-value', function() {
        expect(chart.y(data[0].values[0])).toEqual(400);
        expect(chart.y(data[2].values[3])).toEqual(0);
      });

      it('should calculate x,y min,max for all series', function() {
        expect(chart.xMin()).toEqual(0);
        expect(chart.xMax()).toEqual(12);
        expect(chart.yMin()).toEqual(0);
        expect(chart.yMax()).toEqual(12);
      });
    });

    describe('Values', function() {
      beforeEach(function() {
        Chart = Chart.extend('Values', helpers.mixin(extensions.Series, extensions.XY, extensions.Values));
        data = values;
        width = 500;

        chart = new Chart();
        chart.itemPadding(0.0);
        chart.setScales();

        processed = processData(data);

        spyOn(chart, 'seriesIndex').and.callFake(function(d, i) {
          return d.series.seriesIndex;
        });
      });

      it('should set x-scale to ordinal with x-values', function() {
        expect(chart._xScale().domain()).toEqual(['A', 'B', 'C', 'D', 'E']);
      });

      it('should find centered x-value', function() {
        expect(chart.x(data[0].values[2])).toEqual(250);
      });

      it('should find adjacent centered x-value', function() {
        expect(chart.adjacentX(processed[0].values[2])).toEqual(225);
        expect(chart.adjacentX(processed[1].values[2])).toEqual(275);
      });

      it('should update x and itemWidth with displayAdjacent', function() {
        chart.displayAdjacent(false);
        expect(chart.x(processed[0].values[2])).toEqual(250);
        expect(chart.x(processed[1].values[2])).toEqual(250);

        chart.displayAdjacent(true);
        expect(chart.x(processed[0].values[2])).toEqual(225);
        expect(chart.x(processed[1].values[2])).toEqual(275);
      });
    });
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);

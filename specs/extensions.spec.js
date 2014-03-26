(function(d3, _, helpers, extensions) {
  
  describe('extensions', function() {
    var Chart, chart, data, values, width, height, processed;

    // Process data to mimic actual data that is passed to (d, i) methods
    function processData(data) {
      return _.map(data, function(series, index) {
        return chart.seriesValues(series, index);
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
          this.options = {};
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
      }).extend('Series', extensions.Series);
    });

    describe('Series', function() {
      beforeEach(function() {
        chart = new Chart();
      });

      /**
        Note: the underlying behavior to retrieve the seriesIndex from a data point is potentially expensive
        TODO: Refactor usage to find series index from series only (below)
      
        Currently, only extensions.Values.adjacentX uses seriesIndex
      */
      it('(TEMP) should get series index of given data point after passing through seriesValues', function() {
        processed = processData(data);

        expect(chart.seriesIndex(processed[0][3], 3)).toEqual(0);
        expect(chart.seriesIndex(processed[1][2], 2)).toEqual(1);
        expect(chart.seriesIndex(processed[2][1], 1)).toEqual(2);
      });

      xit('should get series index for given series after passing through seriesValues', function() {
        processed = processData(data);

        expect(chart.seriesIndex(processed[1])).toEqual(1);
      });
    });

    describe('XY', function() {
      beforeEach(function() {
        Chart = Chart.mixin(extensions.Series).extend('XY', extensions.XY);
        chart = new Chart();
        data = data;
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
        Chart = Chart
          .mixin(extensions.Series, extensions.XY)
          .extend('Values', extensions.Values);
        chart = new Chart();
        data = values;
        width = 500;
        chart.itemPadding(0.0);

        chart.setScales();
        processed = processData(data);
      });

      it('should set x-scale to ordinal with x-values', function() {
        expect(chart._xScale().domain()).toEqual(['A', 'B', 'C', 'D', 'E']);
      });

      it('should find centered x-value', function() {
        expect(chart.x(data[0].values[2])).toEqual(250);
      });

      it('should find adjacent centered x-value', function() {
        expect(chart.adjacentX(processed[0][2])).toEqual(225);
        expect(chart.adjacentX(processed[1][2])).toEqual(275);
      });

      it('should update itemX and itemWidth with displayAdjacent', function() {
        chart.displayAdjacent(false);
        expect(chart.itemX(processed[0][2])).toEqual(250);
        expect(chart.itemX(processed[1][2])).toEqual(250);

        chart.displayAdjacent(true);
        expect(chart.itemX(processed[0][2])).toEqual(225);
        expect(chart.itemX(processed[1][2])).toEqual(275);
      });
    });
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);

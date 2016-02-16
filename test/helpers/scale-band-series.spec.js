const expect = require('expect');
const scaleBandSeries = require('../../').scaleBandSeries;

describe('scaleBandSeries', () => {
  it('should use seriesCount', () => {
    var scale = scaleBandSeries()
      .domain([0, 1, 2, 3])
      .rangeRoundBands([0, 100]);

    expect(scale(2, 1)).toEqual(50 + (25 / 2));
    expect(scale.rangeBand()).toEqual(25);

    scale.seriesCount(2);

    expect(scale(2, 1)).toEqual(50 + 12.5 + (12.5 / 2));
    expect(scale.rangeBand()).toEqual(12.5);
  });

  it('should use adjacent', () => {
    var scale = scaleBandSeries()
      .domain([0, 1, 2, 3])
      .rangeRoundBands([0, 100])
      .seriesCount(2);

    expect(scale(2, 1)).toEqual(50 + 12.5 + (12.5 / 2));
    expect(scale.rangeBand()).toEqual(12.5);

    scale.adjacent(false);

    expect(scale(2, 1)).toEqual(50 + (25 / 2));
    expect(scale.rangeBand()).toEqual(25);
  });

  it('should use seriesPadding', () => {
    var scale = scaleBandSeries()
      .domain([0, 1, 2, 3])
      .rangeRoundBands([0, 100])
      .seriesCount(2);

    expect(scale(2, 1)).toEqual(50 + 12.5 + (12.5 / 2));
    expect(scale.rangeBand()).toEqual(12.5);

    scale.seriesPadding(0.1);

    expect(scale(2, 1)).toEqual(50 + 12.5 + (12.5 / 2));
    expect(scale.rangeBand()).toEqual(12.5 - 1.25);
  });
});

const expect = require('expect');
const mockElement = require('../_helpers/mock-element');
const alignText = require('../../').helpers.alignText;

describe('alignText', () => {
  it('should determine offset by y', () => {
    const element = mockElement({
      bbox: {x: 0, y: -17, height: 20, width: 100}
    });

    expect(alignText(element)).toEqual(17);
  });

  it('should determine offset by y and given line-height', () => {
    const element = mockElement({
      bbox: {x: 0, y: -17, height: 20, width: 100}
    });

    expect(alignText(element, 50)).toEqual(17 + (50 - 20)/2);
  });
});

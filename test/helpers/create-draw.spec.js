import expect, {createSpy} from 'expect';
import createDraw from '../../src/helpers/create-draw';

describe('createDraw', () => {
  var context = {};

  beforeEach(() => {
    const selection = {
      call: () => {},
      remove: () => {}
    };
    const subselection = {
      call(fn) { fn.call(selection); },
      enter() { return {call: (fn) => fn.call(selection) }; },
      exit() { return {call: (fn) => fn.call(selection) }; }
    };

    Object.assign(context, {
      selection,
      subselection,
      props: {}
    });
  });
  afterEach(() => {
    context = {};
  });

  it('should select in draw function', () => {
    const {selection, subselection, props} = context;

    const select = createSpy().andCall(function() {
      return subselection;
    });
    const enter = createSpy();

    const draw = createDraw({
      select,
      enter
    });

    draw(selection, props);

    expect(select.calls[0].context).toEqual(selection);
    expect(select).toHaveBeenCalledWith(props);

    expect(enter.calls[0].context).toEqual(selection);
    expect(enter).toHaveBeenCalledWith(props);
  });

  it('should enter in draw function', () => {
    const {selection, subselection, props} = context;

    const enter = createSpy();
    const draw = createDraw({
      select: () => subselection,
      enter
    });

    draw(subselection, props);

    expect(enter.calls[0].context).toEqual(selection);
    expect(enter).toHaveBeenCalledWith(props);
  });

  it('should update in draw function', () => {
    const {selection, subselection, props} = context;

    const update = createSpy();
    const draw = createDraw({
      select: () => subselection,
      update
    });

    draw(subselection, props);

    expect(update.calls[0].context).toEqual(selection);
    expect(update).toHaveBeenCalledWith(props);
  });

  it('should merge in draw function', () => {
    const {selection, subselection, props} = context;

    const merge = createSpy();
    const draw = createDraw({
      select: () => subselection,
      merge
    });

    draw(subselection, props);

    expect(merge.calls[0].context).toEqual(selection);
    expect(merge).toHaveBeenCalledWith(props);
  });

  it('should exit in draw function', () => {
    const {selection, subselection, props} = context;

    const exit = createSpy();
    const draw = createDraw({
      select: () => subselection,
      exit
    });

    draw(subselection, props);

    expect(exit.calls[0].context).toEqual(selection);
    expect(exit).toHaveBeenCalledWith(props);
  });

  it('should combine all steps into draw function', () => {
    const {selection, subselection} = context;
    const props = {};

    const select = createSpy().andCall(function() {
      return subselection;
    });
    const enter = createSpy();
    const update = createSpy();
    const merge = createSpy();
    const exit = createSpy();

    const draw = createDraw({
      select,
      enter,
      update,
      merge,
      exit
    });

    draw(selection, props);

    expect(select.calls[0].context).toEqual(selection);
    expect(select).toHaveBeenCalledWith(props);

    expect(enter.calls[0].context).toEqual(selection);
    expect(enter).toHaveBeenCalledWith(props);

    expect(update.calls[0].context).toEqual(selection);
    expect(update).toHaveBeenCalledWith(props);

    expect(merge.calls[0].context).toEqual(selection);
    expect(merge).toHaveBeenCalledWith(props);

    expect(exit.calls[0].context).toEqual(selection);
    expect(exit).toHaveBeenCalledWith(props);
  });
});

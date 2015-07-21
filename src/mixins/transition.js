import {
  property
} from '../helpers';
import {
  isUndefined
} from '../utils';

/**
  Mixin for handling common transition behaviors

  @class Transition
  @namespace mixins
*/
var Transition = {
  /**
    Delay start of transition by specified milliseconds.

    @property delay
    @type Number|Function
    @default d3 default: 0
  */
  delay: property('delay', {type: 'Function'}),

  /**
    Transition duration in milliseconds.

    @property duration
    @type Number|Function
    @default d3 default: 250ms
  */
  duration: property('duration', {type: 'Function'}),

  /**
    Transition ease function

    - See: [Transitions#ease](https://github.com/mbostock/d3/wiki/Transitions#ease)
    - Note: arguments to pass to `d3.ease` are not supported

    @property ease
    @type String|Function
    @default d3 default: 'cubic-in-out'
  */
  ease: property('ease', {type: 'Function'}),

  /**
    Setup delay, duration, and ease for transition

    @example
    ```js
    d3.chart('Chart').extend('Custom', helpers.mixin(Transition, {
      initialize: function() {
        this.layer('circles', this.base, {
          // ...
          events: {
            'merge:transition': function() {
              // Set delay, duration, and ease from properties
              this.chart().setupTransition(this);
            }
          }
        });
      }
    }));
    ```
    @method setupTransition
    @param {d3.selection} selection
  */
  setupTransition: function setupTransition(selection) {
    var delay = this.delay();
    var duration = this.duration();
    var ease = this.ease();

    if (!isUndefined(delay))
      selection.delay(delay);
    if (!isUndefined(duration))
      selection.duration(duration);
    if (!isUndefined(ease))
      selection.ease(ease);
  }
};

export default Transition;

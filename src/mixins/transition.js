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
    @default (use container value, if available)
  */
  delay: property('delay', {
    set: function(value) {
      // type: 'Function' is desired, but default_value needs to be evaluated
      // wrap value in function
      return {
        override: function() { return value; }
      };
    },
    default_value: function() {
      return this.container && this.container.delay && this.container.delay();
    }
  }),

  /**
    Transition duration in milliseconds.

    @property duration
    @type Number|Function
    @default (use container value, if available)
  */
  duration: property('duration', {
    set: function(value) {
      return {
        override: function() { return value; }
      };
    },
    default_value: function() {
      return this.container && this.container.delay && this.container.duration();
    }
  }),

  /**
    Transition ease function

    - See: [Transitions#ease](https://github.com/mbostock/d3/wiki/Transitions#ease)
    - Note: arguments to pass to `d3.ease` are not supported

    @property ease
    @type String|Function
    @default (use container value, if available)
  */
  ease: property('ease', {
    set: function(value) {
      return {
        override: function() { return value; }
      };
    },
    default_value: function() {
      return this.container && this.container.delay && this.container.ease();
    }
  }),

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

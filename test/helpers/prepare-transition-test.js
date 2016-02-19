const tape = require('tape');
const mockSelection = require('../_helpers/mock-selection');
const prepareTransition = require('../..').helpers.prepareTransition;

function addMockTransition(selection) {
  selection.transition = function() {
    return {
      call: function(fn) {
        const result = {};
        fn.call({
          duration: function(value) {
            result.duration = value;
          },
          delay: function(value) {
            result.delay = value;
          },
          ease: function(value) {
            result.ease = value;
          }
        });

        return result;
      }
    };
  }

  return selection;
}

tape('prepareTransition() prepares transition for given selection', t => {
  const selection = addMockTransition(mockSelection());
  const result = selection.transition().call(prepareTransition({
    duration: 1000,
    delay: 2000,
    ease: 'in'
  }));

  t.equal(result.duration, 1000);
  t.equal(result.delay, 2000);
  t.equal(result.ease, 'in');
  t.end();
});

export default function createPrepare() {
  const steps = Array.prototype.slice.call(arguments);
  return (selection, props) => {
    return steps.reduce((memo, step) => {
      return step(selection, memo);
    }, props);
  };
}

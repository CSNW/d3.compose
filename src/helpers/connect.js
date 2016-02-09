import isChart from './is-chart';
import createChart from './create-chart';

export default function connect(/*mapStateToProps, mapDispatchToProps, mergeProps, options*/) {
  // TODO

  return (Connectee) => {
    if (!isChart(Connectee)) {
      Connectee = createChart(Connectee);
    }

    return Connectee;
  };
}

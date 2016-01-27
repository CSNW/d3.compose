import {isChart, createChart} from '../helpers';

export default function connect(mapStateToProps, mapDispatchToProps, mergeProps, options) {
  return (Connectee) => {
    if (!isChart(Connectee)) {
      Connectee = createChart(Connectee);
    }

    return Connectee;
  };
}

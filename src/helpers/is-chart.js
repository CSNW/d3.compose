export default function isChart(PossibleChart) {
  return PossibleChart && PossibleChart.prototype && PossibleChart.prototype.render && PossibleChart.prototype.setProps && true || false;
}

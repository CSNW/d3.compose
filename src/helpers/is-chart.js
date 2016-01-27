export default function isChart(Chart) {
  return Chart && Chart.prototype.render && Chart.prototype.setProps;
}

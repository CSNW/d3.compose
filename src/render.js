export default function render(chart, selection, options) {
  const instance = new chart.type(selection, chart.props);
  instance.render();
}

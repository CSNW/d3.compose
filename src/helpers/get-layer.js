export default function getLayer(selection, id) {
  var layer = selection.select('[data-layer="id"]');

  if (layer.empty()) {
    layer = selection.append('g')
      .attr('data-layer', id);
  }

  return layer;
}

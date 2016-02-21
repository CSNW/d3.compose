export default function getLayer(selection, id, type) {
  type = type || 'g';
  var layer = selection.select('[data-layer="' + id + '"]');

  if (layer.empty()) {
    layer = selection.append(type)
      .attr('data-layer', id);
  }

  return layer;
}

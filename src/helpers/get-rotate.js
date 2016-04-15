export default function getRotate(degrees, center) {
  var rotation = 'rotate(' + (degrees || 0);
  if (center) {
    rotation += ' ' + (center.x || 0) + ',' + (center.y || 0);
  }
  rotation += ')';

  return rotation;
}

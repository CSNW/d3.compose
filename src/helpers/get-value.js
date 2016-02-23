export default function getValue(value, scale, d, i, j) {
  // TODO verify series index for all cases (enter, update, merge, exit)
  return scale(value(d, i, j), j);
}

export default function getBandwidth(scale) {
  // v4: d3.scaleBand() -> bandwidth
  // v3: d3.scale.ordinal() -> rangeBand

  if (scale.bandwidth) {
    return scale.bandwidth();
  } else if (scale.rangeBand) {
    return scale.rangeBand();
  } else {
    return 0;
  }
}

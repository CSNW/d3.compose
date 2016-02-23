export default function isSeriesData(data) {
  return Array.isArray(data) && data[0] && Array.isArray(data[0].values);
}

const pkg = require('./package.json');
const banner = `/*!
 * ${pkg.name} - ${pkg.description}
 * v${pkg.version} - ${pkg.homepage} - @license: ${pkg.license}
 */`

export default {
  moduleName: 'd3c',
  format: 'umd',
  external: ['d3'],
  globals: {
    d3: 'd3'
  },
  banner,
  outro: `exports.version = '${pkg.version}';`,
};

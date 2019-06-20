const pkg = require('./package.json');
const banner = `/*!
 * ${pkg.name} - ${pkg.description}
 * v${pkg.version} - ${pkg.homepage} - @license: ${pkg.license}
 */`

export default {
  input: 'index.js',
  external: ['d3'],
  output: {
    file: 'build/d3.compose.js',
    format: 'umd',
    name: 'd3c',
    globals: {
      d3: 'd3'
    },
    banner,
  outro: `exports.version = '${pkg.version}';`,
  }
};

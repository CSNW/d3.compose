var uglify = require('uglify-js');
var fs = require('fs');

process.chdir('../js/');

var input_files = [
  'vendor/jquery-2.1.3.js',
  'vendor/bootstrap.js',
  'vendor/underscore.js',
  'vendor/backbone.js',
  'vendor/d3.js',
  'vendor/d3.chart.js',
  'vendor/highlight.pack.js'
];
var output_file = 'vendor.min.js';
var result = uglify.minify(input_files);

fs.writeFileSync(output_file, result.code);
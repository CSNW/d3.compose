var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var docs_path = process.env.docs_path || path.resolve('../_docs/');
var paths = {
  data: docs_path + 'data.json',
  dist: docs_path + 'additional/dist/',
  css: docs_path + 'additional/dist/d3.compose.css',
  changelog: docs_path + 'additional/CHANGELOG.md',
  'package': docs_path + 'additional/package.json'
};
var output = {
  docs: '../_data/docs.json',
  details: '../_data/details.json',
  dist: '../',
  css: '../d3.compose.css',
  changelog: '../_includes/changelog.md',
  'package': '../_data/package.json'
};
var dist = {
  all: {
    dev: 'd3.compose-all.js',
    prod: 'd3.compose-all.min.js',
    map: 'd3.compose-all.min.js.map'
  },
  mixins: {
    dev: 'd3.compose-mixins.js',
    prod: 'd3.compose-mixins.min.js',
    map: 'd3.compose-mixins.min.js.map',
  },
  src: {
    dev: 'd3.compose.js',
    prod: 'd3.compose.min.js',
    map: 'd3.compose.min.js.map',
  }
};

// 1. Create _data/docs.json
if (!fs.existsSync(paths.data))
  throw new Error('Docs data not found. Run "yuidoc" on the master branch to generate docs data.');

var data = JSON.parse(fs.readFileSync(paths.data));
var docs = generateDocs(data);

fs.writeFileSync(output.docs, JSON.stringify(docs));

// 2. Create _data/details.json
var details = generateDetails(paths.dist, output.dist, dist);

fs.writeFileSync(output.details, JSON.stringify(details));

// 3. Copy d3.compose files
copy(paths.css, output.css);

_.each(dist, function(files) {
  _.each(files, function(file) {
    copy(paths.dist + file, output.dist + file);
  });
});

// 4. Copy changelog to includes and package to data
copy(paths.changelog, output.changelog);
copy(paths['package'], output['package']);

function generateDocs(data) {
  var formatted = {classes: {}};

  _.each(data.classes, function(cls, class_name) {
    // For namespaced classes, convert dot to dash for jekyll compatibility
    var class_id = class_name;
    var formatted_class_name = class_name;

    if (class_name.indexOf('.') >= 0) {
      var parts = class_name.split('.');
      class_id = class_name.replace(/\./g, '-');

      formatted_class_name = parts[parts.length - 1];
    }

    var class_items = _.chain(data.classitems)
      .filter({'class': class_name})
      .map(function(classitem) {
        classitem = _.extend({
          id: class_id + '-' + classitem.name
        }, classitem);

        if (classitem.params) {
          classitem.code = classitem.name + '(' + _.map(classitem.params, function(param) {
            var code = param.name.trim();

            if (param['optdefault'])
              code += ' = ' + param['optdefault'].trim();

            if (param.optional)
              code = '[' + code + ']';

            return code; 
          }).join(', ') + ')';
        }
        else if (classitem.itemtype == 'property') {
          var code = '{' + classitem.type + '}';

          if (classitem['default'])
            code += ' [' + classitem['default'] + ']';

          classitem.code = code;
        }

        return classitem;
      })
      .value();

    formatted.classes[class_id] = _.extend({}, cls, {
      shortname: formatted_class_name,
      id: class_id,
      classitems: class_items
    });
  });

  return formatted;
}

function generateDetails(input_folder, output_folder, dist) {
  var gzipSize = require('gzip-size');
  var details = {};

  _.each(dist, function(files, key) {
    // Load filename and path for files
    details[key] = {
      css: {
        filename: 'd3.compose.css',
        path: '/d3.compose/d3.compose.css'
      }
    };
    _.each(files, function(file, file_key) {
      details[key][file_key] = {
        filename: file,
        path: '/d3.compose/' + file
      };
    });
    
    details[key].dev.size = Math.round(fs.statSync(input_folder + files.dev).size / 1000);
    
    var prod_file = fs.readFileSync(input_folder + files.prod);
    details[key].prod.size = Math.round(gzipSize.sync(prod_file) / 100) / 10;
  });
  
  return details;
}

function copy(from, to) {
  fs.writeFileSync(to, fs.readFileSync(from));
}
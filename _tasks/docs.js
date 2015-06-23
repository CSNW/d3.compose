var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var docs_path = process.env.docs_path || path.resolve('../_docs/');
console.log('path', docs_path);
// 1. Create docs.json
if (!fs.existsSync(docs_path + 'data.json'))
  throw new Error('Docs data not found. Run "yuidoc" on the master branch to generate docs data.');

var docs = JSON.parse(fs.readFileSync(docs_path + 'data.json'));
var formatted = {classes: {}};

_.each(docs.classes, function(cls, class_name) {
  // For namespaced classes, convert dot to dash for jekyll compatibility
  var class_id = class_name;
  var formatted_class_name = class_name;

  if (class_name.indexOf('.') >= 0) {
    var parts = class_name.split('.');
    class_id = class_name.replace(/\./g, '-');

    formatted_class_name = parts[parts.length - 1];
  }

  var class_items = _.chain(docs.classitems)
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

fs.writeFileSync('../_data/docs.json', JSON.stringify(formatted));

// 2. Copy d3.compose files
fs.writeFileSync('../d3.compose-all.js', fs.readFileSync(docs_path + 'additional/d3.compose-all.js'));
fs.writeFileSync('../d3.compose-all.min.js', fs.readFileSync(docs_path + 'additional/d3.compose-all.min.js'));
fs.writeFileSync('../d3.compose-all.min.js.map', fs.readFileSync(docs_path + 'additional/d3.compose-all.min.js.map'));

fs.writeFileSync('../css/d3.compose.css', fs.readFileSync(docs_path + 'additional/d3.compose.css'));

// 3. Copy changelog to data
fs.writeFileSync('../_includes/changelog.md', fs.readFileSync(docs_path + 'additional/CHANGELOG.md'));
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var _ = require('lodash');

var docs_path = process.env.docs_data || path.resolve('../_docs/data.json');
console.log(docs_path, process.env.docs_data);
if (!fs.existsSync(docs_path))
  throw new Error('Docs data not found. Run "yuidoc" on the master branch to generate docs data.');

var docs = JSON.parse(fs.readFileSync(docs_path));
var formatted = {classes: {}};

_.each(docs.classes, function(cls, class_name) {
  var class_id = cls.name;
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

  formatted.classes[class_name] = _.extend({}, cls, {
    id: class_id,
    classitems: class_items
  });
});

var yml = yaml.dump(formatted);

fs.writeFileSync('../_data/docs.json', JSON.stringify(formatted));

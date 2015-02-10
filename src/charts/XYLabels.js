(function(d3, _, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Labels

    Options:
    - format
    - position (top, right, bottom, left)
    - offset ({x: ..., y: ...})
    - padding
    - anchor (start, middle, end)
    - alignment (top, middle, bottom)
  */
  d3.chart('Chart').extend('XYLabels', mixin(mixins.Series, mixins.XY, mixins.XYHover, {
    initialize: function() {
      // Proxy attach to parent for hover
      var parent = this.options().parent;
      if (parent) {
        parent.on('attach', function() {
          this.container = parent.container;
          this.trigger('attach');
        }.bind(this));
      }

      this.seriesLayer('Labels', this.base, {
        dataBind: function(data) {
          return this.selectAll('g')
            .data(data, chart.keyValue);
        },
        insert: function() {
          var chart = this.chart();

          var labels = this.append('g')
            .attr('class', chart.labelClass)
            .call(chart.insertLabels);

          return labels;
        },
        events: {
          'merge': function() {
            this.chart().mergeLabels(this);
          },
          'merge:transition': function() {
            var chart = this.chart();

            if (chart.delay && chart.delay())
              this.delay(chart.delay());
            if (chart.duration && chart.duration())
              this.duration(chart.duration());
            if (chart.ease && chart.ease())
              this.ease(chart.ease());

            // Position labels
            chart.transitionLabels(this);
          }
        }
      });
    },

    transform: function(data) {
      if (!helpers.isSeriesData(data))
        data = [{key: 'labels', name: 'Labels', values: data}];

      // TODO Use ticks / domain from xScale
      // ticks = scale.ticks ? scale.ticks.apply(scale, [10]) : scale.domain()
      return data;
    },

    format: property('format', {
      type: 'Function',
      set: function(value) {
        if (_.isString(value)) {
          return {
            override: d3.format(value)
          };
        }
      }
    }),

    position: property('position', {
      default_value: 'top',
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),

    offset: property('offset', {
      default_value: {x: 0, y: 0},
      set: function(offset) {
        if (_.isNumber(offset)) {
          offset = {
            top: {x: 0, y: -offset},
            right: {x: offset, y: 0},
            bottom: {x: 0, y: offset},
            left: {x: -offset, y: 0}
          }[this.position()];

          if (!offset)
            offset = {x: 0, y: 0};

          return {
            override: offset
          };
        }
      }
    }),

    padding: property('padding', {default_value: 2}),

    anchor: property('anchor', {
      default_value: function() {
        return {
          'top': 'middle',
          'right': 'start',
          'bottom': 'middle',
          'left': 'end'
        }[this.position()];
      },
      validate: function(value) {
        return _.contains(['start', 'middle', 'end'], value);
      }
    }),

    alignment: property('labelAlignment', {
      default_value: function() {
        return {
          'top': 'bottom',
          'right': 'middle',
          'bottom': 'top',
          'left': 'middle'
        }[this.position()];
      },
      validate: function(value) {
        return _.contains(['top', 'middle', 'bottom'], value);
      }
    }),

    delay: property('delay', {type: 'Function'}),
    duration: property('duration', {type: 'Function'}),
    ease: property('ease', {type: 'Function'}),

    labelText: di(function(chart, d, i) {
      var value = helpers.valueOrDefault(d.label, chart.yValue.call(this, d, i));
      var format = chart.format();

      return format ? format(value) : value;
    }),

    labelClass: di(function(chart, d, i) {
      return 'chart-label' + (d['class'] ? ' ' + d['class'] : '');
    }),

    insertLabels: function(selection) {
      selection.append('rect')
        .attr('class', 'chart-label-bg');
      selection.append('text')
        .attr('class', 'chart-label-text');
    },

    mergeLabels: function(selection) {
      var chart = this;
      
      selection.selectAll('text')
        .text(this.labelText);

      // Calculate layout
      var labels = [];
      var options = {
        offset: chart.offset(),
        padding: chart.padding(),
        anchor: chart.anchor(),
        alignment: chart.alignment()
      };
      selection.each(function(d, i, j) {
        if (!labels[j])
          labels[j] = [];

        // Store values for label and calculate layout
        var label = prepareLabel(chart, this, d, i , j);
        labels[j].push(label);

        calculateLayout(chart, options, label);
      });

      // Collision detection
      handleCollisions(chart, labels);

      // Layout labels
      _.each(labels, function(series) {
        _.each(series, function(label) {
          setLayout(chart, label);
        });
      });
    },

    transitionLabels: function(selection) {
      selection.attr('opacity', 1);
    },

    onMouseEnter: function(position) {
      var points = this.getClosestPoints(position.chart);

      this.removeHighlight();
      _.each(points, function(series) {
        if (series && series.length) {
          var closest = series[0];
        
          if (closest.distance < 50)
            this.highlightLabel(closest); 
        }
      }, this);
    },
    onMouseMove: function(position) {
      var points = this.getClosestPoints(position.chart);

      this.removeHighlight();
      _.each(points, function(series) {
        if (series && series.length) {
          var closest = series[0];
        
          if (closest.distance < 50)
            this.highlightLabel(closest);
        }
      }, this);
    },
    onMouseLeave: function() {
      this.removeHighlight();
    },

    highlightLabel: function(point) {
      var label = this.base.selectAll('g.chart-series')
        .selectAll('g')[point.j][point.i];

      if (label)
        d3.select(label).classed('highlight', true);
    },
    removeHighlight: function() {
      this.base
        .selectAll('g')
        .selectAll('g')
        .classed('highlight', false);
    }
  }));

  function prepareLabel(chart, element, d, i, j) {
    var selection = d3.select(element);
    var text = selection.select('text');
    var bg = selection.select('rect');

    return {
      x: chart.x.call(element, d, i),
      y: chart.y.call(element, d, i),
      element: element,
      selection: selection,
      text: {
        element: text.node(),
        selection: text
      },
      bg: {
        element: bg.node(),
        selection: bg
      }
    };
  }

  function calculateLayout(chart, options, label) {
    var text_bounds = label.text.element.getBBox();

    // Need to adjust text for line-height
    var text_y_adjustment = 0;
    try {
      var style = window.getComputedStyle(label.text.element);
      text_y_adjustment = -(parseInt(style['line-height']) - parseInt(style['font-size'])) / 2;
    }
    catch (ex) {}

    // Position background
    var layout = label.bg.layout = {
      x: options.offset.x,
      y: options.offset.y,
      width: text_bounds.width + 2*options.padding,
      height: text_bounds.height + 2*options.padding
    };

    // Set width / height of label
    label.width = layout.width;
    label.height = layout.height;

    if (options.anchor == 'end')
      layout.x -= layout.width;
    else if (options.anchor == 'middle')
      layout.x -= (layout.width / 2);

    if (options.alignment == 'bottom')
      layout.y -= layout.height;
    else if (options.alignment == 'middle')
      layout.y -= (layout.height / 2);

    // Center text in background
    label.text.layout = {
      x: layout.x + (layout.width / 2) - (text_bounds.width / 2),
      y: layout.y + (layout.height / 2) - (text_bounds.height / 2) + text_bounds.height + text_y_adjustment
    };
  }

  function handleCollisions(chart, labels) {
    _.each(labels, function(series, seriesIndex) {
      // Check through remaining series for collisions
      _.each(labels.slice(seriesIndex + 1), function(compareSeries) {
        _.each(compareSeries, function(compareLabel) {
          _.each(series, function(label) {
            if (checkForOverlap(label, compareLabel))
              groupLabels(label, compareLabel);
          });
        });
      });
    });

    function checkForOverlap(labelA, labelB) {
      var a = getEdges(labelA);
      var b = getEdges(labelB);

      var contained_LR = (b.left < a.left && b.right > a.right);
      var contained_TB = (b.bottom < a.bottom && b.top > a.top);
      var overlap_LR = (b.left >= a.left && b.left < a.right) || (b.right > a.left && b.right <= a.right) || contained_LR;
      var overlap_TB = (b.top >= a.top && b.top < a.bottom) || (b.bottom > a.top && b.bottom <= a.bottom) || contained_TB;

      return overlap_LR && overlap_TB;

      function getEdges(label) {
        return {
          left: label.x,
          right: label.x + label.width,
          top: label.y,
          bottom: label.y + label.height
        };
      }
    }

    function groupLabels(labelA, labelB) {
      if (labelA.group && labelB.group) {
        // Move labelB group labels into labelA group
        _.each(labelB.group.labels, function(label) {
          labelA.group.labels.push(label);
          label.group = labelA.group;
        });

        updateGroupPositions(labelA.group);
      }
      else if (labelA.group) {
        addLabelToGroup(labelB, labelA.group);
      }
      else if (labelB.group) {
        addLabelToGroup(labelA, labelB.group);
      }
      else {
        var group = {labels: []};
        addLabelToGroup(labelA, group);
        addLabelToGroup(labelB, group);
      }
    }

    function addLabelToGroup(label, group) {
      group.labels.push(label);
      label.group = group;
      label.originalY = label.y;

      updateGroupPositions(group);
    }

    function updateGroupPositions(group) {
      var byY = _.chain(group.labels)
        .each(function(label) {
          // Reset to original y
          label.y = label.originalY;
        })
        .sortBy(function(label) {
          return label.y;
        })
        .reverse()
        .value();

      _.each(byY, function(label, index) {
        var prev = _.first(byY, index);
        var overlap;

        for (var i = prev.length - 1; i >= 0; i--) {
          if (checkForOverlap(label, prev[i])) {
            overlap = prev[i];
            break;
          }
        }

        if (overlap)
          label.y = overlap.y - label.height;
      });
    }
  }

  function setLayout(chart, label) {
    label.bg.selection
      .attr('transform', helpers.translate(label.bg.layout.x, label.bg.layout.y))
      .attr('width', label.bg.layout.width)
      .attr('height', label.bg.layout.height);

    label.text.selection
      .attr('transform', helpers.translate(label.text.layout.x, label.text.layout.y));

    // Position label and set opacity to fade-in
    label.selection
      .attr('transform', helpers.translate(label.x, label.y))
      .attr('opacity', 0);
  }

})(d3, _, d3.chart.helpers, d3.chart.mixins);

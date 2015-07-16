(function(d3, helpers, mixins, charts) {
  var utils = helpers.utils;
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Standalone or "embeddable" labels (uses `mixins.Labels` and `attachLabels` to embed in chart)

    ### Extending

    To extend the `Labels` chart, the following methods are available:

    - `insertLabels`
    - `mergeLabels`
    - `layoutLabels`
    - `transitionLabels`
    - `onDataBind`
    - `onInsert`
    - `onEnter`
    - `onEnterTransition`
    - `onUpdate`
    - `onUpdateTransition`
    - `onMerge`
    - `onMergeTransition`
    - `onExit`
    - `onExitTransition`

    View the `Labels.js` source for the default implementation and more information on these methods.

    @example
    ```js
    var chart = d3.select('#chart').chart('Compose', function(data) {
      return {
        charts: {
          input: {
            type: 'Lines',
            data: data.input,
            // xScale, yScale, other properties...

            // Show labels with default properties
            labels: true
          },
          output: {
            type: 'Bars',
            data: data.output,
            // xScale, yScale, other properties...

            // Pass options to labels
            labels: {
              offset: 2,
              position: 'top',
              style: {
                'font-size': '14px'
              },
              format: d3.format(',0d')
            }
          },
          labels: {
            type: 'Labels',
            data: data.labels,

            // xScale, yScale, other properties...
          }
        }
      };
    });
  
    chart.draw({
      input: [1, 2, 3],
      output: [10, 20, 30],
      labels: [
        {x: 0, y: 0},
        {x: 0, y: 30, label: 'Override (y by default)'},
        {x: 2, y: 0},
        {x: 2, y: 30}
      ]
    });
    ```
    @class Labels
    @extends Chart, Series, XY, Hover, Transition, StandardLayer
  */
  charts.Labels = charts.Chart.extend('Labels', mixin(
    mixins.Series,
    mixins.XY,
    mixins.Hover,
    mixins.Transition,
    mixins.StandardLayer,
    {
      initialize: function() {
        // Proxy attach to parent for hover
        var parent = this.options().parent;
        if (parent) {
          this.parent = parent;
          parent.on('attach', function() {
            this.container = parent.container;
            this.trigger('attach');
          }.bind(this));
        }

        // Use StandardLayer for extensibility
        this.standardSeriesLayer('Labels', this.base);
      },

      transform: function(data) {
        if (!helpers.isSeriesData(data))
          data = [{key: 'labels', name: 'Labels', values: data}];

        // TODO Use ticks / domain from xScale
        // ticks = scale.ticks ? scale.ticks.apply(scale, [10]) : scale.domain()
        return data;
      },

      /**
        Formatting function or string (string is passed to `d3.format`) for label values

        @property format
        @type String|Function
      */
      format: property('format', {
        type: 'Function',
        set: function(value) {
          if (utils.isString(value)) {
            return {
              override: d3.format(value)
            };
          }
        }
      }),

      /**
        Label position relative to data point
        (top, right, bottom, or left)

        @property position
        @type String
        @default top
      */
      position: property('position', {
        default_value: 'top',
        validate: function(value) {
          return utils.contains(['top', 'right', 'bottom', 'left'], value);
        }
      }),

      /**
        Offset between data point and label
        (if `Number` is given, offset is set based on position)

        @property offset
        @type Number|Object
        @default {x: 0, y: 0}
      */
      offset: property('offset', {
        default_value: {x: 0, y: 0},
        set: function(offset) {
          if (utils.isNumber(offset)) {
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

      /**
        Padding between text and label background

        @property padding
        @type Number
        @default 1
      */
      padding: property('padding', {default_value: 1}),

      /**
        Define text anchor (start, middle, or end)

        (set by default based on label position)

        @property anchor
        @type String
        @default middle
      */
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
          return utils.contains(['start', 'middle', 'end'], value);
        }
      }),

      /**
        Define text-aligmment (top, middle, or bottom)
        
        (set by default based on label position)

        @property alignment
        @type String
        @default middle
      */
      alignment: property('alignment', {
        default_value: function() {
          return {
            'top': 'bottom',
            'right': 'middle',
            'bottom': 'top',
            'left': 'middle'
          }[this.position()];
        },
        validate: function(value) {
          return utils.contains(['top', 'middle', 'bottom'], value);
        }
      }),

      /**
        Get label text for data-point (uses "label" property or y-value)

        @method labelText
        @param {Any} d
        @param {Number} i
        @return {String}
      */
      labelText: di(function(chart, d, i) {
        var value = helpers.valueOrDefault(d.label, chart.yValue.call(this, d, i));
        var format = chart.format();

        return format ? format(value) : value;
      }),

      /**
        Get class for label group

        @method labelClass
        @param {Any} d
        @param {Number} i
        @return {String}
      */
      labelClass: di(function(chart, d, i) {
        return 'chart-label' + (d['class'] ? ' ' + d['class'] : '');
      }),

      onDataBind: function onDataBind(selection, data) {
        return selection.selectAll('g')
          .data(data, this.key);
      },
      onInsert: function onInsert(selection) {
        return selection.append('g')
          .on('mouseenter', this.mouseEnterPoint)
          .on('mouseleave', this.mouseLeavePoint)
          .call(this.insertLabels);
      },
      onMerge: function onMerge(selection) {
        selection.attr('class', this.labelClass);

        this.mergeLabels(selection);
        this.layoutLabels(selection);
      },
      onMergeTransition: function onMergeTransition(selection) {
        // Transition labels into position
        this.setupTransition(selection);
        this.transitionLabels(selection);
      },

      // (Override for custom labels)
      insertLabels: function(selection) {
        selection.append('rect')
          .attr('class', 'chart-label-bg');
        selection.append('text')
          .attr('class', 'chart-label-text');
      },

      // (Override for custom labels)
      mergeLabels: function(selection) {
        selection.selectAll('text')
          .text(this.labelText);
      },

      // (Override for custom labels)
      layoutLabels: function(selection) {
        // Calculate layout
        var chart = this;
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
        labels.forEach(function(series) {
          series.forEach(function(label) {
            setLayout(chart, label);
          });
        });
      },

      // (Override for custom labels)
      transitionLabels: function(selection) {
        selection.attr('opacity', 1);
      }
    }
  ), {
    z_index: 150
  });

  /**
    (in-progress)

    @class HoverLabels
  */
  d3.chart('Labels').extend('HoverLabels', mixin(mixins.Hover, {
    initialize: function() {
      this.on('attach', function() {
        this.container.on('mouseenter:point', this.onMouseEnterPoint.bind(this));
        this.container.on('mouseleave:point', this.onMouseLeavePoint.bind(this));
      }.bind(this));
    },

    /**
      Maximum distance to find active points

      @property hoverTolerance
      @type Number
      @default 20
    */
    hoverTolerance: property('hoverTolerance', {
      set: function(value) {
        // Pass through hover tolerance to parent (if present)
        if (this.parent && this.parent.hoverTolerance)
          this.parent.hoverTolerance(value);
      },
      default_value: 20
    }),

    // Don't fade in labels, hidden until hover
    transitionLabels: function(selection) {},

    onMouseEnterPoint: function(point) {
      var label = this.findLabelForPoint(point);
      if (label)
        d3.select(label).attr('opacity', 1);
    },
    onMouseLeavePoint: function(point) {
      var label = this.findLabelForPoint(point);
      if (label)
        d3.select(label).attr('opacity', 0);
    },

    findLabelForPoint: function(point) {
      var labels = this.base.selectAll('g.chart-series').selectAll('g');
      var chart = this;
      var label;

      labels.each(function(d, i, j) {
        var series = chart.seriesData.call(this, d, i, j);
        if (d === point.d && series === point.series)
          label = this;
      });

      return label;
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
    var text_y_adjustment = helpers.alignText(label.text.element);

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
      y: layout.y + (layout.height / 2) - (text_bounds.height / 2) + text_y_adjustment
    };
  }

  function handleCollisions(chart, labels) {
    labels.forEach(function(series, seriesIndex) {
      // Check through remaining series for collisions
      labels.slice(seriesIndex + 1).forEach(function(compareSeries) {
        compareSeries.forEach(function(compareLabel) {
          series.forEach(function(label) {
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
        utils.objectEach(labelB.group.labels, function(label) {
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
      function reset(label) {
        // Reset to original y
        label.y = label.originalY;
      }
      function sort(label) {
        return label.y;
      }

      var byY = utils.sortBy(group.labels.forEach(reset), sort).reverse();

      byY.forEach(function(label, index) {
        var prev = utils.first(byY, index);
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

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);

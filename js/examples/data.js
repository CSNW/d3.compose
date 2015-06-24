(function(examples) {

  // TODO...
  examples.data = {
    a: [
      {
        key: 'a', values: [
          {x: 0, y: 10}, {x: 10, y: 20}, {x: 20, y: 50}, {x: 30, y: 100}
        ]
      },
      {
        key: 'b', values: [
          {x: 0, y: 50}, {x: 10, y: 45}, {x: 20, y: 15}, {x: 30, y: 10}
        ]
      }
    ],

    b: {
      input: [
        {
          key: 'input',
          values: [{x: 'a', y: 100}, {x: 'b', y: 200}, {x: 'c', y: 300}]
        }
      ],
      results: [
        {
          key: 'run-1',
          values: [{x: 'a', y: 10}, {x: 'b', y: 30}, {x: 'c', y: 20}]
        },
        {
          key: 'run-2',
          values: [{x: 'a', y: 15}, {x: 'b', y: 25}, {x: 'c', y: 20}]
        }
      ]
    }
  };

})(examples);
